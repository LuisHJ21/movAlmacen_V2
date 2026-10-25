import { useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { ArticleStep } from '@/components/generar-vale/ArticleStep'
import { ItemPickerStep } from '@/components/generar-vale/ItemPickerStep'
import { MatrixStep } from '@/components/generar-vale/MatrixStep'
import { MovementStep } from '@/components/generar-vale/MovementStep'
import { ReferenceStep } from '@/components/generar-vale/ReferenceStep'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { ValeSummary } from '@/components/generar-vale/ValeSummary'
import { WarehouseStep } from '@/components/generar-vale/WarehouseStep'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Matrix, ReferenceDocument, Warehouse } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet, PalletData } from '@/interfaces/pallet.interface'
import { almacenService } from '@/services/almacen.service'
import type { ValeLine, ValePalletGroup } from '@/interfaces/vale.interface'
import { palletService } from '@/services/pallet.service'
import { getAllowedMovementKind } from '@/utils/validations'
import {
  buildValeLines,
  excludedLines,
  getValeWarehouse,
  isEmptyItem,
  isValeLineValid,
  mergeLines,
  palletInWarehouse,
} from '@/utils/vale'

type Step = 'scan' | 'article' | 'movement' | 'matrix' | 'warehouse' | 'reference' | 'summary' | 'addPallet' | 'selectItems'

const stepTitles: Record<Step, string> = {
  scan: 'Escanear pallet',
  article: 'Artículo',
  movement: 'Tipo de movimiento',
  matrix: 'Matriz contable',
  warehouse: 'Almacén',
  reference: 'Documento de referencia',
  summary: 'Resumen',
  addPallet: 'Agregar pallet',
  selectItems: 'Elegir ítems',
}

/**
 * Flujo de Generar vale:
 * escanear → artículo (si hay varios) → movimiento → matriz (si hay varias)
 * → almacén (F_REF=0) | referencia (F_REF=1; en ingresos viene del pallet) → resumen
 * En salidas: se eligen los ítems de cada pallet (si tiene más de uno), se pueden quitar ítems,
 * volver a agregar los excluidos y agregar más pallets del mismo artículo y almacén.
 */

/**
 * Selección de ítems en salidas:
 * - initial: ítems del pallet inicial al armar el vale
 * - newPallet: ítems de un pallet que se está agregando (aún no está en el vale)
 * - more: volver a agregar ítems excluidos de un pallet del vale
 */
interface ItemPicker {
  mode: 'initial' | 'newPallet' | 'more'
  palletCode: string
  candidates: ValeLine[]
  /** Solo en newPallet: el pallet a agregar al confirmar */
  pending?: ValePalletGroup
}
export default function GenerarValePage() {
  // Historial de pasos visitados: los pasos automáticos no se apilan, así ← regresa al último elegido
  const [history, setHistory] = useState<Step[]>(['scan'])
  const step = history[history.length - 1]

  const [pallet, setPallet] = useState<Pallet | null>(null)
  const [articleCode, setArticleCode] = useState<string | null>(null)
  const [movement, setMovement] = useState<Movement | null>(null)
  const [matrices, setMatrices] = useState<Matrix[]>([])
  const [matrix, setMatrix] = useState<Matrix | null>(null)
  const [palletData, setPalletData] = useState<PalletData | null>(null)
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [reference, setReference] = useState<ReferenceDocument | null>(null)
  const [referenceFromPallet, setReferenceFromPallet] = useState(false)
  // Detalle del vale: el primer grupo es el pallet escaneado al inicio
  const [groups, setGroups] = useState<ValePalletGroup[]>([])
  const [valeDate, setValeDate] = useState(() => new Date())

  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  const [isPreparing, setIsPreparing] = useState(false)
  const [prepareError, setPrepareError] = useState<string>()
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string>()
  const [summaryNotice, setSummaryNotice] = useState<string>()
  const [itemPicker, setItemPicker] = useState<ItemPicker | null>(null)

  const goTo = (next: Step) => setHistory((h) => [...h, next])
  const goBack = () => setHistory((h) => h.slice(0, -1))

  const restart = () => {
    setHistory(['scan'])
    setPallet(null)
    setArticleCode(null)
    resetFromMovement()
    setMovement(null)
    setVerifyError(undefined)
  }

  // Lo que depende del movimiento (y del artículo) se recalcula al cambiarlos
  const resetFromMovement = () => {
    setMatrices([])
    setMatrix(null)
    setPalletData(null)
    setWarehouse(null)
    setReference(null)
    setReferenceFromPallet(false)
    setGroups([])
    setSummaryNotice(undefined)
    setPrepareError(undefined)
  }

  // Paso 1: verificar pallet
  const handleScanned = async (code: string) => {
    setIsVerifying(true)
    setVerifyError(undefined)
    try {
      const verified = await palletService.verify(code)
      if (verified.articles.length === 0) {
        setVerifyError('El pallet no tiene artículos')
        return
      }
      setPallet(verified)
      setMovement(null)
      resetFromMovement()
      // Un solo artículo: se elige automáticamente
      if (verified.articles.length === 1) {
        setArticleCode(verified.articles[0])
        goTo('movement')
      } else {
        setArticleCode(null)
        goTo('article')
      }
    } catch (error) {
      setVerifyError(getApiErrorMessage(error, 'No fue posible verificar el pallet'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleArticle = (code: string) => {
    if (code !== articleCode) {
      setMovement(null)
      resetFromMovement()
    }
    setArticleCode(code)
    goTo('movement')
  }

  // Arma el detalle del vale y muestra el resumen
  const openSummary = (
    mov: Movement,
    data: PalletData,
    selectedReference: ReferenceDocument | null,
    selectedWarehouseCode: string | null,
  ) => {
    if (!pallet) return
    const pool = buildValeLines(data.items, pallet.code, mov.kind, selectedReference)
    const first: ValePalletGroup = { pallet, lines: pool, pool }
    // Pallets agregados antes (al regresar a cambiar almacén o referencia):
    // se conservan los del nuevo almacén, con la nueva referencia
    const valeWarehouse = getValeWarehouse(selectedWarehouseCode, selectedReference)
    const extras = groups.slice(1)
    const kept = extras.filter((g) => palletInWarehouse(g.pallet.warehouse, valeWarehouse))
    const removed = extras.length - kept.length
    setSummaryNotice(
      removed > 0
        ? `Se ${removed === 1 ? 'quitó 1 pallet' : `quitaron ${removed} pallets`} que no pertenece${removed === 1 ? '' : 'n'} al almacén ${valeWarehouse}.`
        : undefined,
    )
    setGroups([
      first,
      ...kept.map((g) => ({
        ...g,
        lines: g.lines.map((l) => ({ ...l, reference: selectedReference })),
        pool: g.pool.map((l) => ({ ...l, reference: selectedReference })),
      })),
    ])
    setValeDate(new Date())

    // Salida con varios ítems: primero se eligen cuáles entran al vale
    if (mov.kind === 'SAL' && pool.length > 1) {
      setItemPicker({ mode: 'initial', palletCode: pallet.code, candidates: pool })
      return goTo('selectItems')
    }
    goTo('summary')
  }

  const updateLine = (
    palletCode: string,
    index: number,
    changes: Partial<Pick<ValeLine, 'packages' | 'extraKg'>>,
  ) =>
    setGroups((current) =>
      current.map((g) =>
        g.pallet.code !== palletCode
          ? g
          : { ...g, lines: g.lines.map((line, i) => (i === index ? { ...line, ...changes } : line)) },
      ),
    )

  // Almacén al que pertenece el vale (elegido directo o desde la referencia)
  const valeWarehouse = getValeWarehouse(warehouse?.code, reference)

  // Salidas: agregar otro pallet del mismo artículo y del mismo almacén
  const handleAddPallet = async (code: string) => {
    if (!movement || !articleCode) return
    if (groups.some((g) => g.pallet.code === code)) {
      setAddError('El pallet ya está en el vale')
      return
    }
    setIsAdding(true)
    setAddError(undefined)
    try {
      const verified = await palletService.verify(code)
      if (getAllowedMovementKind(verified) !== 'SAL') {
        setAddError('El pallet no tiene almacén y ubicación: no puede salir')
        return
      }
      if (!verified.articles.includes(articleCode)) {
        setAddError(`El pallet no contiene el artículo ${articleCode}`)
        return
      }
      if (!palletInWarehouse(verified.warehouse, valeWarehouse)) {
        setAddError(`El pallet está en el almacén ${verified.warehouse}; el vale es del almacén ${valeWarehouse}`)
        return
      }
      const data = await palletService.getData(verified.code, movement.code, articleCode)
      if (data.items.every(isEmptyItem)) {
        setAddError('El pallet no tiene ítems disponibles para este movimiento')
        return
      }
      const pool = buildValeLines(data.items, verified.code, movement.kind, reference)
      const group: ValePalletGroup = { pallet: verified, lines: pool, pool }
      if (pool.length > 1) {
        // Varios ítems: elegir cuáles entran antes de sumarlo al vale
        setItemPicker({ mode: 'newPallet', palletCode: verified.code, candidates: pool, pending: group })
        return goTo('selectItems')
      }
      setGroups((current) => [...current, group])
      goBack()
    } catch (error) {
      setAddError(getApiErrorMessage(error, 'No fue posible agregar el pallet'))
    } finally {
      setIsAdding(false)
    }
  }

  const removePallet = (palletCode: string) => {
    if (window.confirm(`¿Quitar el pallet ${palletCode} del vale?`)) {
      setGroups((current) => current.filter((g) => g.pallet.code !== palletCode))
    }
  }

  // Quitar un ítem: vuelve a quedar disponible en "Agregar ítems".
  // En un pallet agregado, quitar su último ítem quita el pallet.
  const removeLine = (palletCode: string, item: string) => {
    const group = groups.find((g) => g.pallet.code === palletCode)
    if (!group) return
    const isInitial = groups[0]?.pallet.code === palletCode
    if (group.lines.length === 1) {
      if (isInitial) return
      if (window.confirm(`Es el último ítem del pallet ${palletCode}. ¿Quitar el pallet del vale?`)) {
        setGroups((current) => current.filter((g) => g.pallet.code !== palletCode))
      }
      return
    }
    setGroups((current) =>
      current.map((g) => (g.pallet.code === palletCode ? { ...g, lines: g.lines.filter((l) => l.item !== item) } : g)),
    )
  }

  const openAddItems = (palletCode: string) => {
    const group = groups.find((g) => g.pallet.code === palletCode)
    if (!group) return
    setItemPicker({ mode: 'more', palletCode, candidates: excludedLines(group) })
    goTo('selectItems')
  }

  const handleItemsSelected = (selected: ValeLine[]) => {
    if (!itemPicker) return
    const { mode, palletCode, pending } = itemPicker
    if (mode === 'newPallet' && pending) {
      setGroups((current) => [...current, { ...pending, lines: selected }])
      // Regresa al resumen (saca "Elegir ítems" y "Agregar pallet" del historial)
      setHistory((h) => h.slice(0, -2))
    } else {
      setGroups((current) =>
        current.map((g) => {
          if (g.pallet.code !== palletCode) return g
          return { ...g, lines: mode === 'initial' ? selected : mergeLines(g, selected) }
        }),
      )
      if (mode === 'initial') goTo('summary')
      else goBack()
    }
    setItemPicker(null)
  }

  // Desde el resumen: confirmar antes de descartar el vale armado
  const confirmRestart = () => {
    if (window.confirm('¿Descartar este vale y empezar uno nuevo?')) restart()
  }

  const openAddPallet = () => {
    setAddError(undefined)
    goTo('addPallet')
  }

  // Siguiente destino tras tener matriz: almacén, referencia por elegir o referencia del pallet
  const goToDestination = (mov: Movement, data: PalletData) => {
    if (!mov.requiresReference) return goTo('warehouse')

    const palletReference = mov.kind === 'ING' ? (data.items.find((i) => i.reference)?.reference ?? null) : null
    if (palletReference) {
      // Ingreso: la referencia ya viene en los datos del pallet
      setReference(palletReference)
      setReferenceFromPallet(true)
      return openSummary(mov, data, palletReference, null)
    }
    setReferenceFromPallet(false)
    goTo('reference')
  }

  // Paso movimiento: consultar matriz y datos del pallet
  const handleMovement = async (selected: Movement) => {
    if (!pallet || !articleCode) return
    setIsPreparing(true)
    setPrepareError(undefined)
    try {
      const [foundMatrices, data] = await Promise.all([
        almacenService.getMatrices(selected.code, articleCode),
        palletService.getData(pallet.code, selected.code, articleCode),
      ])

      if (foundMatrices.length === 0) {
        setPrepareError(`No hay matriz contable para ${selected.code} con el artículo ${articleCode}. Elige otro movimiento.`)
        return
      }

      if (selected.code !== movement?.code) resetFromMovement()
      setMovement(selected)
      setMatrices(foundMatrices)
      setPalletData(data)

      // Una sola matriz: se elige automáticamente
      if (foundMatrices.length === 1) {
        setMatrix(foundMatrices[0])
        goToDestination(selected, data)
      } else {
        goTo('matrix')
      }
    } catch (error) {
      setPrepareError(getApiErrorMessage(error, 'No fue posible consultar la matriz'))
    } finally {
      setIsPreparing(false)
    }
  }

  const handleMatrix = (selected: Matrix) => {
    setMatrix(selected)
    if (movement && palletData) goToDestination(movement, palletData)
  }

  const handleWarehouse = (selected: Warehouse) => {
    setWarehouse(selected)
    if (movement && palletData) openSummary(movement, palletData, null, selected.code)
  }

  const handleReference = (selected: ReferenceDocument) => {
    setReference(selected)
    setReferenceFromPallet(false)
    if (movement && palletData) openSummary(movement, palletData, selected, null)
  }

  // Salidas: no se puede continuar con líneas inválidas
  const linesValid = movement?.kind !== 'SAL' || groups.every((g) => g.lines.every(isValeLineValid))

  const stepNumber = history.length

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Generar vale"
        subtitle={`Paso ${stepNumber} · ${stepTitles[step]}`}
        onBack={history.length > 1 ? goBack : undefined}
      />

      {step === 'scan' && (
        <ScanPalletStep
          onScanned={handleScanned}
          isLoading={isVerifying}
          serverError={verifyError}
          onCodeChange={() => setVerifyError(undefined)}
        />
      )}

      {step === 'article' && pallet && (
        <ArticleStep pallet={pallet} initialArticle={articleCode} onConfirm={handleArticle} />
      )}

      {step === 'movement' && pallet && articleCode && (
        <MovementStep
          pallet={pallet}
          articleCode={articleCode}
          initialMovement={movement}
          onConfirm={handleMovement}
          isSubmitting={isPreparing}
          submitError={prepareError}
          onSelectionChange={() => setPrepareError(undefined)}
        />
      )}

      {step === 'matrix' && pallet && articleCode && movement && (
        <MatrixStep
          pallet={pallet}
          articleCode={articleCode}
          movement={movement}
          matrices={matrices}
          initialMatrix={matrix}
          onConfirm={handleMatrix}
        />
      )}

      {step === 'warehouse' && pallet && articleCode && movement && (
        <WarehouseStep
          pallet={pallet}
          articleCode={articleCode}
          movement={movement}
          initialWarehouse={warehouse}
          onConfirm={handleWarehouse}
        />
      )}

      {step === 'reference' && pallet && articleCode && movement && (
        <ReferenceStep
          pallet={pallet}
          articleCode={articleCode}
          movement={movement}
          initialReference={referenceFromPallet ? null : reference}
          onConfirm={handleReference}
        />
      )}

      {step === 'summary' && pallet && articleCode && movement && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4">
            {summaryNotice && (
              <div className="mb-4">
                <Alert type="info" onClose={() => setSummaryNotice(undefined)}>
                  {summaryNotice}
                </Alert>
              </div>
            )}
            <ValeSummary
              date={valeDate}
              movement={movement}
              articleCode={articleCode}
              article={palletData?.article ?? null}
              warehouse={warehouse}
              matrix={matrix}
              groups={groups}
              onLineChange={updateLine}
              onRemovePallet={removePallet}
              onRemoveLine={movement.kind === 'SAL' ? removeLine : undefined}
              onAddItems={movement.kind === 'SAL' ? openAddItems : undefined}
            />
          </div>
          <div className="space-y-2 border-t border-border bg-card px-4 py-3">
            {/* Temporal: el registro del vale está pendiente de definir */}
            <p className={`text-center text-sm ${linesValid ? 'text-muted-foreground' : 'font-medium text-destructive'}`}>
              {linesValid ? 'El registro del vale está en construcción.' : 'Corrige los ítems marcados en rojo.'}
            </p>
            {/* Salidas: "Agregar pallet" siempre visible, fijo en el pie */}
            <div className={movement.kind === 'SAL' ? 'grid grid-cols-2 gap-2' : ''}>
              {movement.kind === 'SAL' && (
                <Button onClick={openAddPallet} icon={<Plus aria-hidden className="size-5" />} className="px-3">
                  Agregar pallet
                </Button>
              )}
              <Button
                variant="secondary"
                fullWidth
                onClick={confirmRestart}
                icon={<RotateCcw aria-hidden className="size-5" />}
                className="px-3"
              >
                Nuevo vale
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'addPallet' && articleCode && (
        <ScanPalletStep
          title={`Agregar pallet (${groups.length + 1})`}
          description={`Debe tener el artículo ${articleCode}${valeWarehouse ? ` y estar en el almacén ${valeWarehouse}` : ''}.`}
          submitLabel="Agregar al vale"
          onScanned={handleAddPallet}
          isLoading={isAdding}
          serverError={addError}
          onCodeChange={() => setAddError(undefined)}
        />
      )}

      {step === 'selectItems' && itemPicker && (
        <ItemPickerStep
          // Nueva instancia por pallet/modo para reiniciar la selección
          key={`${itemPicker.mode}-${itemPicker.palletCode}`}
          palletCode={itemPicker.palletCode}
          candidates={itemPicker.candidates}
          initiallySelected={itemPicker.mode !== 'more'}
          intro={
            itemPicker.mode === 'more'
              ? 'Marca los ítems que quieres volver a agregar al vale.'
              : 'Marca los ítems de este pallet que salen en el vale. Los demás podrás agregarlos después.'
          }
          confirmLabel={(count) =>
            itemPicker.mode === 'initial'
              ? `Continuar con ${count} ${count === 1 ? 'ítem' : 'ítems'}`
              : `Agregar ${count} ${count === 1 ? 'ítem' : 'ítems'}`
          }
          onConfirm={handleItemsSelected}
        />
      )}
    </div>
  )
}
