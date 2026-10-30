import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListPlus, Plus, Save, Trash2, TriangleAlert, X } from 'lucide-react'
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
import { ValeExtrasFields } from '@/components/generar-vale/ValeExtrasFields'
import { ValeSummary } from '@/components/generar-vale/ValeSummary'
import { WarehouseStep } from '@/components/generar-vale/WarehouseStep'
import { Alert } from '@/components/ui/Alert'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OptionList } from '@/components/ui/OptionList'
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
import { formatCount, formatWeight, toSentenceCase } from '@/utils/format'
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
  | 'selectPalletItems'
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
  selectPalletItems: 'Añadir ítem',
  plan: 'Plan diario',
  done: 'Vale guardado',
}


interface ItemPicker {
  mode: 'initial' | 'newPallet' | 'more'
  palletCode: string
  candidates: ValeLine[]
  pending?: ValePalletGroup
}
export default function GenerarValePage() {
  const navigate = useNavigate()
  const { usuario: user } = useAuth()
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
  const [groups, setGroups] = useState<ValePalletGroup[]>([])
  const [valeDate, setValeDate] = useState(() => new Date())
  const [formId, setFormId] = useState('')

  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  const [isPreparing, setIsPreparing] = useState(false)
  const [prepareError, setPrepareError] = useState<string>()
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string>()
  const [summaryNotice, setSummaryNotice] = useState<string>()
  const [itemPicker, setItemPicker] = useState<ItemPicker | null>(null)
  const [planDiario, setPlanDiario] = useState<PlanDiario | null>(null)
  const [saveNotice, setSaveNotice] = useState<{ type: 'error' | 'info'; text: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string>()
  const [savedValeNumber, setSavedValeNumber] = useState<string>()
  useEffect(() => setSaveNotice(undefined), [groups])

  const goTo = (next: Step) => setHistory((h) => [...h, next])
  const goBack = () => setHistory((h) => h.slice(0, -1))

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
    setPlanDiario(null)
  }

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

  const openSummary = (
    mov: Movement,
    data: PalletData,
    selectedReference: ReferenceDocument | null,
    selectedWarehouseCode: string | null,
  ) => {
    if (!pallet) return
    const pool = buildValeLines(data.items, pallet.codigo, mov.tipo, selectedReference)
    const first: ValePalletGroup = { pallet, lineas: pool, disponibles: pool }
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

  const valeWarehouse = getValeWarehouse(warehouse?.codigo, reference)

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

  const [palletToRemove, setPalletToRemove] = useState<{ palletCode: string; ultimoItem?: string } | null>(null)
  const closeRemovePallet = useCallback(() => setPalletToRemove(null), [])
  const confirmRemovePallet = () => {
    if (!palletToRemove) return
    setGroups((current) => current.filter((g) => g.pallet.codigo !== palletToRemove.palletCode))
    setPalletToRemove(null)
  }

  const removePallet = (palletCode: string) => setPalletToRemove({ palletCode })

  const removeLine = (palletCode: string, item: string) => {
    const group = groups.find((g) => g.pallet.codigo === palletCode)
    if (!group) return
    const isInitial = groups[0]?.pallet.codigo === palletCode
    if (group.lineas.length === 1) {
      if (isInitial) return
      setPalletToRemove({ palletCode, ultimoItem: item })
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

  const palletsConItems = groups.filter((g) => excludedLines(g).length > 0)

  const openAddItem = () => {
    if (palletsConItems.length === 1) return openAddItems(palletsConItems[0].pallet.codigo)
    goTo('selectPalletItems')
  }

  const handleItemsSelected = (selected: ValeLine[]) => {
    if (!itemPicker) return
    const { mode, palletCode, pending } = itemPicker
    if (mode === 'newPallet' && pending) {
      setGroups((current) => [...current, { ...pending, lineas: selected }])
      setHistory((h) => h.slice(0, -2))
    } else {
      setGroups((current) =>
        current.map((g) => {
          if (g.pallet.codigo !== palletCode) return g
          return { ...g, lineas: mode === 'initial' ? selected : mergeLines(g, selected) }
        }),
      )
      if (mode === 'initial') goTo('summary')
      else setHistory((h) => h.slice(0, h.lastIndexOf('summary') + 1))
    }
    setItemPicker(null)
  }

  const handlePlan = (plan: PlanDiario) => {
    setPlanDiario(plan)
    setSaveNotice(undefined)
    goBack()
  }

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const closeConfirmCancel = useCallback(() => setConfirmCancelOpen(false), [])
  const confirmCancel = () => setConfirmCancelOpen(true)

  const openAddPallet = () => {
    setAddError(undefined)
    goTo('addPallet')
  }

  const goToDestination = (mov: Movement, data: PalletData, palletWarehouse: Warehouse | null = warehouse) => {
    if (!mov.requiereReferencia) {
      return palletWarehouse ? openSummary(mov, data, null, palletWarehouse.codigo) : goTo('warehouse')
    }

    const palletReference = mov.tipo === 'ING' ? (data.items.find((i) => i.referencia)?.referencia ?? null) : null
    if (palletReference) {
      setReference(palletReference)
      setReferenceFromPallet(true)
      return openSummary(mov, data, palletReference, null)
    }
    setReferenceFromPallet(false)
    goTo('reference')
  }

  const handleMovement = async (selected: Movement) => {
    if (!pallet || !articleCode) return
    setIsPreparing(true)
    setPrepareError(undefined)
    try {
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
    if (movement && palletData) goToDestination(movement, palletData, pallet?.almacen ? warehouse : null)
  }

  const handleWarehouse = (selected: Warehouse) => {
    setWarehouse(selected)
    if (movement && palletData) openSummary(movement, palletData, null, selected.codigo)
  }

  const handleReference = (selected: ReferenceDocument) => {
    if (movement?.tipo === 'SAL' && pallet && !referenceMatchesPallet(selected, pallet)) return
    setReference(selected)
    setReferenceFromPallet(false)
    if (movement && palletData) openSummary(movement, palletData, selected, null)
  }

  const lineRules = { editable: movement?.tipo === 'SAL' }
  const allLines = groups.flatMap((g) => g.lineas)
  const linesValid = allLines.every((l) => isValeLineValid(l, lineRules))
  const faltaPlan = !!movement?.solicitaPlan && !planDiario
  const totals = valeTotals(allLines)
  const canSave = linesValid && !faltaPlan && allLines.length > 0 && totals.weight > 0

  const [recepcionado, setRecepcionado] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const closeConfirmSave = useCallback(() => setConfirmSaveOpen(false), [])

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
          planDiarioCode: movement.solicitaPlan ? (planDiario?.codigo ?? null) : null,
          groups,
          recepcionado,
          observations: observaciones,
        }),
      )
      setSavedMessage(response?.message)
      setSavedValeNumber(response?.nroVale?.trim() || undefined)
      setHistory(['done'])
    } catch (error) {
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
              onRemoveLine={removeLine}
              plan={
                movement.solicitaPlan
                  ? { valor: planDiario, pendiente: faltaPlan && linesValid, onPick: () => goTo('plan') }
                  : undefined
              }
            />
            <ValeExtrasFields
              recepcionado={recepcionado}
              observaciones={observaciones}
              onRecepcionadoChange={setRecepcionado}
              onObservacionesChange={setObservaciones}
              disabled={isSaving}
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
                  {!linesValid
                    ? 'Corrige los ítems marcados en rojo.'
                    : faltaPlan
                      ? 'Falta elegir el plan diario del vale.'
                      : 'El vale no tiene peso para mover.'}
                </p>
              )
            )}
            {movement.tipo === 'SAL' && palletsConItems.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={openAddItem}
                  disabled={isSaving}
                  icon={<ListPlus aria-hidden className="size-5" />}
                  className="px-3"
                >
                  Añadir ítem
                </Button>
                <Button
                  variant="secondary"
                  onClick={openAddPallet}
                  disabled={isSaving}
                  icon={<Plus aria-hidden className="size-5" />}
                  className="px-3"
                >
                  Agregar pallet
                </Button>
              </div>
            )}
            <div
              className={
                (movement.tipo === 'SAL') === (palletsConItems.length === 0) ? 'grid grid-cols-2 gap-2' : ''
              }
            >
              {movement.tipo === 'ING' && palletsConItems.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={openAddItem}
                  disabled={isSaving}
                  icon={<ListPlus aria-hidden className="size-5" />}
                  className="px-3"
                >
                  Añadir ítem
                </Button>
              )}
              {movement.tipo === 'SAL' && palletsConItems.length === 0 && (
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

      <ConfirmDialog
        open={!!palletToRemove}
        title={palletToRemove?.ultimoItem ? 'Es el último ítem del pallet' : '¿Quitar el pallet del vale?'}
        Icon={Trash2}
        tone="destructive"
        destructiveConfirm
        confirmLabel="Sí, quitar"
        cancelLabel="Conservar"
        confirmIcon={<Trash2 aria-hidden className="size-5" />}
        onCancel={closeRemovePallet}
        onConfirm={confirmRemovePallet}
      >
        {palletToRemove &&
          (() => {
            const group = groups.find((g) => g.pallet.codigo === palletToRemove.palletCode)
            const lineTotals = valeTotals(group?.lineas ?? [])
            return (
              <div className="space-y-2">
                {palletToRemove.ultimoItem && (
                  <p className="text-muted-foreground">
                    Si quitas el ítem <span className="font-semibold text-foreground">#{palletToRemove.ultimoItem}</span>, el
                    pallet queda sin ítems y sale del vale.
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="font-mono font-bold">{palletToRemove.palletCode}</span>
                  <span className="font-mono text-muted-foreground">
                    {group?.lineas.length ?? 0} {group?.lineas.length === 1 ? 'ítem' : 'ítems'} · {formatWeight(lineTotals.weight)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Podrás volver a agregarlo con “Agregar pallet”.</p>
              </div>
            )
          })()}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmCancelOpen}
        title="¿Cancelar este vale?"
        Icon={TriangleAlert}
        tone="destructive"
        destructiveConfirm
        confirmLabel="Sí, cancelar"
        cancelLabel="Seguir editando"
        confirmIcon={<X aria-hidden className="size-5" />}
        onCancel={closeConfirmCancel}
        onConfirm={() => navigate('/')}
      >
        <p className="text-muted-foreground">
          Se perderá lo que llevas avanzado
          {pallet && (
            <>
              {' '}
              del pallet <span className="font-mono font-semibold text-foreground">{pallet.codigo}</span>
            </>
          )}
          {allLines.length > 0 && (
            <>
              {' '}
              ({groups.length} {groups.length === 1 ? 'pallet' : 'pallets'}, {allLines.length}{' '}
              {allLines.length === 1 ? 'ítem' : 'ítems'})
            </>
          )}
          . No se guardará nada.
        </p>
      </ConfirmDialog>

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
            {recepcionado.trim() && (
              <div className="flex justify-between gap-3 py-1.5">
                <dt className="text-muted-foreground">Recepcionado</dt>
                <dd className="truncate font-semibold">{recepcionado.trim()}</dd>
              </div>
            )}
            {observaciones.trim() && (
              <div className="py-1.5">
                <dt className="text-muted-foreground">Observaciones</dt>
                <dd className="mt-0.5 font-semibold break-words whitespace-pre-line">{observaciones.trim()}</dd>
              </div>
            )}
          </dl>
        )}
       
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

      {step === 'selectPalletItems' && (
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Elige el pallet del que quieres añadir ítems. Luego marcas cuáles entran al vale.
          </p>
          <OptionList
            legend="Pallet"
            name="pallet-items"
            items={palletsConItems.map((g) => {
              const disponibles = excludedLines(g)
              const total = valeTotals(disponibles)
              return {
                key: g.pallet.codigo,
                badge: g.pallet.codigo,
                title: `${disponibles.length} ${disponibles.length === 1 ? 'ítem para añadir' : 'ítems para añadir'}`,
                meta: `${formatCount(total.packages)} bultos · ${formatWeight(total.weight)} · ${g.lineas.length} en el vale`,
              }
            })}
            selectedKey={null}
            onSelect={openAddItems}
            emptyMessage="No hay ítems para añadir."
            badgePlacement="top"
          />
        </div>
      )}

      {step === 'selectItems' && itemPicker && (
        <ItemPickerStep
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

      {step === 'plan' && movement && (
        <PlanDiarioStep movement={movement} itemCount={allLines.length} selected={planDiario} onConfirm={handlePlan} />
      )}
    </div>
  )
}
