import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, X } from 'lucide-react'
import { ValeSaved } from '@/components/generar-vale/ValeSaved'
import { useAuth } from '@/hooks/useAuth'
import { isAxiosError } from 'axios'
import { getApiErrorMessage } from '@/api/axiosClient'
import { ArticleStep } from '@/components/generar-vale/ArticleStep'
import { ItemPickerStep } from '@/components/generar-vale/ItemPickerStep'
import { MatrixStep } from '@/components/generar-vale/MatrixStep'
import { MovementStep } from '@/components/generar-vale/MovementStep'
import { PlanDiarioStep } from '@/components/generar-vale/PlanDiarioStep'
import { ReferenceStep } from '@/components/generar-vale/ReferenceStep'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { ValeSummary } from '@/components/generar-vale/ValeSummary'
import { WarehouseStep } from '@/components/generar-vale/WarehouseStep'
import { Alert } from '@/components/ui/Alert'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Matrix, ReferenceDocument, Warehouse } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet, PalletData } from '@/interfaces/pallet.interface'
import type { PlanDiario } from '@/interfaces/planDiario.interface'
import { almacenService } from '@/services/almacen.service'
import type { ValeLine, ValePalletGroup } from '@/interfaces/vale.interface'
import { palletService } from '@/services/pallet.service'
import { valeService } from '@/services/vale.service'
import { formatWeight, toSentenceCase } from '@/utils/format'
import {
  generateFormId,
  buildValeLines,
  buildValeRequest,
  valeTotals,
  excludedLines,
  getValeWarehouse,
  isEmptyItem,
  isValeLineValid,
  mergeLines,
  palletInWarehouse,
  referenceMatchesPallet,
} from '@/utils/vale'

type Step =
  | 'scan'
  | 'article'
  | 'movement'
  | 'matrix'
  | 'warehouse'
  | 'reference'
  | 'summary'
  | 'addPallet'
  | 'selectItems'
  | 'plan'
  | 'done'

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
  plan: 'Plan diario',
  done: 'Vale guardado',
}

/**
 * Flujo de Generar vale:
 * escanear → artículo (si hay varios) → movimiento → matriz (solo si el movimiento contabiliza; si hay varias)
 * → almacén (fRef=0) | referencia (fRef=1; en ingresos viene del pallet) → resumen
 * En salidas: se eligen los ítems de cada pallet (si tiene más de uno), se pueden quitar ítems,
 * volver a agregar los excluidos y agregar más pallets del mismo artículo y almacén.
 * Si el movimiento solicita plan diario (fSolcitaPlan = '1'), cada ítem lleva el suyo y se elige desde el resumen.
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
  const navigate = useNavigate()
  const { usuario: user } = useAuth()
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
  // Id del formulario: se genera junto con la fecha de carga y se reutiliza en reintentos
  const [formId, setFormId] = useState('')

  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  const [isPreparing, setIsPreparing] = useState(false)
  const [prepareError, setPrepareError] = useState<string>()
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string>()
  const [summaryNotice, setSummaryNotice] = useState<string>()
  const [itemPicker, setItemPicker] = useState<ItemPicker | null>(null)
  // Ítem al que se le está eligiendo plan diario
  const [planPicker, setPlanPicker] = useState<{ palletCode: string; item: string } | null>(null)
  const [saveNotice, setSaveNotice] = useState<{ type: 'error' | 'info'; text: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string>()
  const [savedValeNumber, setSavedValeNumber] = useState<string>()
  // Cualquier cambio en el detalle invalida el aviso de guardado
  useEffect(() => setSaveNotice(undefined), [groups])

  const goTo = (next: Step) => setHistory((h) => [...h, next])
  const goBack = () => setHistory((h) => h.slice(0, -1))

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
      if (verified.articulos.length === 0) {
        setVerifyError('El pallet no tiene artículos')
        return
      }
      setPallet(verified)
      setMovement(null)
      resetFromMovement()
      // Un solo artículo: se elige automáticamente
      if (verified.articulos.length === 1) {
        setArticleCode(verified.articulos[0])
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
    const pool = buildValeLines(data.items, pallet.codigo, mov.tipo, selectedReference)
    const first: ValePalletGroup = { pallet, lineas: pool, disponibles: pool }
    // Pallets agregados antes (al regresar a cambiar almacén o referencia):
    // se conservan los del nuevo almacén, con la nueva referencia
    const valeWarehouse = getValeWarehouse(selectedWarehouseCode, selectedReference)
    const extras = groups.slice(1)
    const kept = extras.filter((g) => palletInWarehouse(g.pallet.almacen, valeWarehouse))
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
        lineas: g.lineas.map((l) => ({ ...l, referencia: selectedReference })),
        disponibles: g.disponibles.map((l) => ({ ...l, referencia: selectedReference })),
      })),
    ])
    const loadedAt = new Date()
    setValeDate(loadedAt)
    setFormId(generateFormId(loadedAt))

    // Salida con varios ítems: primero se eligen cuáles entran al vale
    if (mov.tipo === 'SAL' && pool.length > 1) {
      setItemPicker({ mode: 'initial', palletCode: pallet.codigo, candidates: pool })
      return goTo('selectItems')
    }
    goTo('summary')
  }

  const updateLine = (
    palletCode: string,
    index: number,
    changes: Partial<Pick<ValeLine, 'bultos' | 'kgAdicional'>>,
  ) =>
    setGroups((current) =>
      current.map((g) =>
        g.pallet.codigo !== palletCode
          ? g
          : { ...g, lineas: g.lineas.map((line, i) => (i === index ? { ...line, ...changes } : line)) },
      ),
    )

  // Almacén al que pertenece el vale (elegido directo o desde la referencia)
  const valeWarehouse = getValeWarehouse(warehouse?.codigo, reference)

  // Salidas: agregar otro pallet del mismo artículo y del mismo almacén
  const handleAddPallet = async (code: string) => {
    if (!movement || !articleCode) return
    if (groups.some((g) => g.pallet.codigo === code)) {
      setAddError('El pallet ya está en el vale')
      return
    }
    setIsAdding(true)
    setAddError(undefined)
    try {
      const verified = await palletService.verify(code)
      if (!verified.articulos.includes(articleCode)) {
        setAddError(`El pallet no contiene el artículo ${articleCode}`)
        return
      }
      if (!palletInWarehouse(verified.almacen, valeWarehouse)) {
        setAddError(`El pallet está en el almacén ${verified.almacen}; el vale es del almacén ${valeWarehouse}`)
        return
      }
      const data = await palletService.getData(verified.codigo, movement.codigo, articleCode)
      if (data.items.every(isEmptyItem)) {
        setAddError('El pallet no tiene ítems disponibles para este movimiento')
        return
      }
      const pool = buildValeLines(data.items, verified.codigo, movement.tipo, reference)
      const group: ValePalletGroup = { pallet: verified, lineas: pool, disponibles: pool }
      if (pool.length > 1) {
        // Varios ítems: elegir cuáles entran antes de sumarlo al vale
        setItemPicker({ mode: 'newPallet', palletCode: verified.codigo, candidates: pool, pending: group })
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
      setGroups((current) => current.filter((g) => g.pallet.codigo !== palletCode))
    }
  }

  // Quitar un ítem: vuelve a quedar disponible en "Agregar ítems".
  // En un pallet agregado, quitar su último ítem quita el pallet.
  const removeLine = (palletCode: string, item: string) => {
    const group = groups.find((g) => g.pallet.codigo === palletCode)
    if (!group) return
    const isInitial = groups[0]?.pallet.codigo === palletCode
    if (group.lineas.length === 1) {
      if (isInitial) return
      if (window.confirm(`Es el último ítem del pallet ${palletCode}. ¿Quitar el pallet del vale?`)) {
        setGroups((current) => current.filter((g) => g.pallet.codigo !== palletCode))
      }
      return
    }
    setGroups((current) =>
      current.map((g) => (g.pallet.codigo === palletCode ? { ...g, lineas: g.lineas.filter((l) => l.item !== item) } : g)),
    )
  }

  const openAddItems = (palletCode: string) => {
    const group = groups.find((g) => g.pallet.codigo === palletCode)
    if (!group) return
    setItemPicker({ mode: 'more', palletCode, candidates: excludedLines(group) })
    goTo('selectItems')
  }

  const handleItemsSelected = (selected: ValeLine[]) => {
    if (!itemPicker) return
    const { mode, palletCode, pending } = itemPicker
    if (mode === 'newPallet' && pending) {
      setGroups((current) => [...current, { ...pending, lineas: selected }])
      // Regresa al resumen (saca "Elegir ítems" y "Agregar pallet" del historial)
      setHistory((h) => h.slice(0, -2))
    } else {
      setGroups((current) =>
        current.map((g) => {
          if (g.pallet.codigo !== palletCode) return g
          return { ...g, lineas: mode === 'initial' ? selected : mergeLines(g, selected) }
        }),
      )
      if (mode === 'initial') goTo('summary')
      else goBack()
    }
    setItemPicker(null)
  }

  const openPlan = (palletCode: string, item: string) => {
    setPlanPicker({ palletCode, item })
    goTo('plan')
  }

  // Asigna el plan al ítem y, si se pidió, a los ítems que aún no tienen uno
  const handlePlan = (plan: PlanDiario, aplicarATodos: boolean) => {
    if (!planPicker) return
    setGroups((current) =>
      current.map((g) => ({
        ...g,
        lineas: g.lineas.map((l) =>
          (g.pallet.codigo === planPicker.palletCode && l.item === planPicker.item) || (aplicarATodos && !l.planDiario)
            ? { ...l, planDiario: plan }
            : l,
        ),
      })),
    )
    setPlanPicker(null)
    goBack()
  }

  // Cancelar: descarta todo lo avanzado y vuelve al inicio
  const confirmCancel = () => {
    if (window.confirm('¿Cancelar este vale? Se perderá lo que llevas avanzado.')) navigate('/')
  }

  const openAddPallet = () => {
    setAddError(undefined)
    goTo('addPallet')
  }

  // Siguiente destino tras tener matriz: almacén, referencia por elegir o referencia del pallet.
  // Sin referencia: si el pallet ya tiene almacén se usa ese (palletWarehouse); si no, se elige de la lista.
  const goToDestination = (mov: Movement, data: PalletData, palletWarehouse: Warehouse | null = warehouse) => {
    if (!mov.requiereReferencia) {
      return palletWarehouse ? openSummary(mov, data, null, palletWarehouse.codigo) : goTo('warehouse')
    }

    const palletReference = mov.tipo === 'ING' ? (data.items.find((i) => i.referencia)?.referencia ?? null) : null
    if (palletReference) {
      // Ingreso: la referencia ya viene en los datos del pallet
      setReference(palletReference)
      setReferenceFromPallet(true)
      return openSummary(mov, data, palletReference, null)
    }
    setReferenceFromPallet(false)
    goTo('reference')
  }

  // Paso movimiento: consultar datos del pallet y, si el movimiento contabiliza (F_CONTABILIZA = 1), la matriz
  const handleMovement = async (selected: Movement) => {
    if (!pallet || !articleCode) return
    setIsPreparing(true)
    setPrepareError(undefined)
    try {
      // Sin referencia y con almacén en el pallet: se toma ese almacén (debe existir en la lista)
      const usePalletWarehouse = !selected.requiereReferencia && !!pallet.almacen
      const [foundMatrices, data, warehouses] = await Promise.all([
        selected.contabiliza ? almacenService.getMatrices(selected.codigo, articleCode) : Promise.resolve([]),
        palletService.getData(pallet.codigo, selected.codigo, articleCode),
        usePalletWarehouse ? almacenService.getWarehouses() : Promise.resolve([]),
      ])

      const palletWarehouse = usePalletWarehouse ? (warehouses.find((w) => w.codigo === pallet.almacen) ?? null) : null
      if (usePalletWarehouse && !palletWarehouse) {
        setPrepareError(`El almacén del pallet (${pallet.almacen}) no está en la lista de almacenes disponibles.`)
        return
      }

      if (selected.contabiliza && foundMatrices.length === 0) {
        setPrepareError(`No hay matriz contable para ${selected.codigo} con el artículo ${articleCode}. Elige otro movimiento.`)
        return
      }

      if (selected.codigo !== movement?.codigo) resetFromMovement()
      setMovement(selected)
      setMatrices(foundMatrices)
      setPalletData(data)
      setWarehouse(palletWarehouse)

      // Sin contabilizar no hay matriz; con una sola matriz se elige automáticamente
      if (!selected.contabiliza || foundMatrices.length === 1) {
        setMatrix(foundMatrices[0] ?? null)
        goToDestination(selected, data, palletWarehouse)
      } else {
        goTo('matrix')
      }
    } catch (error) {
      setPrepareError(
        getApiErrorMessage(
          error,
          selected.contabiliza ? 'No fue posible consultar la matriz' : 'No fue posible consultar los datos del pallet',
        ),
      )
    } finally {
      setIsPreparing(false)
    }
  }

  const handleMatrix = (selected: Matrix) => {
    setMatrix(selected)
    // El almacén solo se salta si viene del pallet; si no, se vuelve a elegir de la lista
    if (movement && palletData) goToDestination(movement, palletData, pallet?.almacen ? warehouse : null)
  }

  const handleWarehouse = (selected: Warehouse) => {
    setWarehouse(selected)
    if (movement && palletData) openSummary(movement, palletData, null, selected.codigo)
  }

  const handleReference = (selected: ReferenceDocument) => {
    // Salida: la referencia debe estar proyectada en el almacén del pallet (ReferenceStep ya bloquea las demás)
    if (movement?.tipo === 'SAL' && pallet && !referenceMatchesPallet(selected, pallet)) return
    setReference(selected)
    setReferenceFromPallet(false)
    if (movement && palletData) openSummary(movement, palletData, selected, null)
  }

  // No se puede guardar con líneas inválidas: cantidades (salidas) o plan diario pendiente
  const lineRules = { editable: movement?.tipo === 'SAL', requierePlan: !!movement?.solicitaPlan }
  const allLines = groups.flatMap((g) => g.lineas)
  const linesValid = allLines.every((l) => isValeLineValid(l, lineRules))
  const missingPlans = lineRules.requierePlan ? allLines.filter((l) => !l.planDiario).length : 0
  const totals = valeTotals(allLines)
  // Se guarda con ítems válidos y algo de peso que mover
  const canSave = linesValid && allLines.length > 0 && totals.weight > 0

  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const closeConfirmSave = useCallback(() => setConfirmSaveOpen(false), [])

  // Guardar: POST /vale con un detalle por ítem incluido
  const handleSave = async () => {
    if (!canSave || isSaving || !movement || !articleCode || !user) return
    if (movement.contabiliza && !matrix) return
    setIsSaving(true)
    setSaveNotice(undefined)
    try {
      const response = await valeService.create(
        buildValeRequest({
          date: valeDate,
          formId,
          movement,
          articleCode,
          matrixCode: matrix?.codigo ?? null,
          warehouseCode: valeWarehouse,
          reference,
          username: user.usuario,
          groups,
        }),
      )
      setSavedMessage(response?.message)
      setSavedValeNumber(response?.nroVale?.trim() || undefined)
      // Pantalla final: no se puede regresar al resumen ya guardado
      setHistory(['done'])
    } catch (error) {
      // Sin respuesta (caída, timeout o error del servidor sin CORS): el vale pudo registrarse igual
      const noResponse = isAxiosError(error) && !error.response
      setSaveNotice({
        type: 'error',
        text: noResponse
          ? 'No se recibió respuesta del servidor. El vale pudo haberse registrado: verifícalo antes de volver a guardar.'
          : getApiErrorMessage(error, 'No fue posible guardar el vale'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const stepNumber = history.length

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Generar vale"
        subtitle={step === 'done' ? stepTitles.done : `Paso ${stepNumber} · ${stepTitles[step]}`}
        onBack={history.length > 1 && !isSaving ? goBack : undefined}
        action={
          history.length > 1 &&
          !isSaving && (
            <button
              type="button"
              onClick={confirmCancel}
              className="flex h-touch items-center gap-1.5 rounded-lg px-3 font-heading text-sm font-semibold text-destructive transition-colors duration-150 hover:bg-destructive-soft active:bg-destructive-soft"
            >
              <X aria-hidden className="size-5" />
              Cancelar
            </button>
          )
        }
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
          onDismissError={() => setPrepareError(undefined)}
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
              article={palletData?.articulo ?? null}
              warehouse={warehouse}
              matrix={matrix}
              groups={groups}
              onLineChange={updateLine}
              onRemovePallet={removePallet}
              onRemoveLine={movement.tipo === 'SAL' ? removeLine : undefined}
              onAddItems={movement.tipo === 'SAL' ? openAddItems : undefined}
              onPickPlan={movement.solicitaPlan ? openPlan : undefined}
            />
          </div>
          <div className="space-y-2 border-t border-border bg-card px-4 py-3">
            {saveNotice ? (
              <Alert type={saveNotice.type} onClose={() => setSaveNotice(undefined)}>
                {saveNotice.text}
              </Alert>
            ) : (
              !canSave && (
                <p className="text-center text-sm font-medium text-destructive">
                  {linesValid
                    ? 'El vale no tiene peso para mover.'
                    : missingPlans > 0 && allLines.every((l) => isValeLineValid(l, { ...lineRules, requierePlan: false }))
                      ? `Falta elegir el plan diario de ${missingPlans === 1 ? '1 ítem' : `${missingPlans} ítems`}.`
                      : 'Corrige los ítems marcados en rojo.'}
                </p>
              )
            )}
            {/* Salidas: "Agregar pallet" siempre visible, fijo en el pie junto a Guardar */}
            <div className={movement.tipo === 'SAL' ? 'grid grid-cols-2 gap-2' : ''}>
              {movement.tipo === 'SAL' && (
                <Button
                  variant="secondary"
                  onClick={openAddPallet}
                  disabled={isSaving}
                  icon={<Plus aria-hidden className="size-5" />}
                  className="px-3"
                >
                  Agregar pallet
                </Button>
              )}
              <Button
                fullWidth
                onClick={() => setConfirmSaveOpen(true)}
                disabled={!canSave}
                isLoading={isSaving}
                icon={<Save aria-hidden className="size-5" />}
                className="px-3"
              >
                {isSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación antes de registrar el vale */}
      <ConfirmDialog
        open={confirmSaveOpen}
        title="¿Guardar el vale?"
        Icon={Save}
        confirmLabel="Sí, guardar"
        cancelLabel="Revisar"
        confirmIcon={<Save aria-hidden className="size-5" />}
        onCancel={closeConfirmSave}
        onConfirm={() => {
          setConfirmSaveOpen(false)
          void handleSave()
        }}
      >
        {movement && (
          <dl className="divide-y divide-border rounded-lg border border-border px-3 text-sm">
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="text-muted-foreground">Movimiento</dt>
              <dd className="truncate font-semibold">
                <span className="font-mono">{movement.codigo}</span> · {toSentenceCase(movement.nombre)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="text-muted-foreground">Detalle</dt>
              <dd className="font-semibold">
                {groups.length} {groups.length === 1 ? 'pallet' : 'pallets'} · {allLines.length}{' '}
                {allLines.length === 1 ? 'ítem' : 'ítems'}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="text-muted-foreground">Peso total</dt>
              <dd className="font-mono font-bold">{formatWeight(totals.weight)}</dd>
            </div>
          </dl>
        )}
        <p className="mt-2 text-sm text-muted-foreground">Una vez guardado, el vale no se podrá editar desde aquí.</p>
      </ConfirmDialog>

      {step === 'done' && movement && articleCode && (
        <ValeSaved
          movement={movement}
          articleCode={articleCode}
          palletCount={groups.length}
          itemCount={allLines.length}
          totalWeight={totals.weight}
          date={valeDate}
          message={savedMessage}
          valeNumber={savedValeNumber}
        />
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

      {step === 'plan' && planPicker && movement && articleCode && (() => {
        const line = groups
          .find((g) => g.pallet.codigo === planPicker.palletCode)
          ?.lineas.find((l) => l.item === planPicker.item)
        if (!line) return null
        return (
          <PlanDiarioStep
            palletCode={planPicker.palletCode}
            articleCode={articleCode}
            movement={movement}
            line={line}
            sinPlan={allLines.filter((l) => l !== line && !l.planDiario).length}
            onConfirm={handlePlan}
          />
        )
      })()}
    </div>
  )
}
