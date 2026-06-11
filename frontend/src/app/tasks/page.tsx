"use client"

import { useEffect, useMemo, useState } from "react"
import styled from "styled-components"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TASKS_BASE = `${API_BASE}/api/tasks`

type Collection = {
  collection_id: number
  contract_id: number
  mes_cobro: string
  monto_cobro: string
  moneda: "CLP" | "UF"
  paid_amount_clp: string
  paid_amount_in_currency: string
  is_paid: boolean
  remaining_amount: string
  payments: Array<{
    id: number
    bank_movement: number
    amount_clp: string
    bank_movement_date: string
    bank_movement_glosa: string
  }>
}

type BankMovement = {
  bank_movement_id: number
  fecha: string
  glosa: string
  monto: string
  used_amount: string
  available_amount: string
  payments: Array<{
    id: number
    collection: number
    amount_clp: string
  }>
}

const Wrapper = styled.main`
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem;
  color: #151a23;
`

const Grid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  margin-bottom: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Card = styled.section`
  background: #fff;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 18px 35px rgba(0, 0, 0, 0.08);
`

const Title = styled.h1`
  margin: 0 0 1rem;
`

const Subtitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #334155;
`

const FormRow = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
`

const Input = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
`

const Select = styled.select`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
`

const Button = styled.button`
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: #2563eb;
  color: #fff;
  padding: 0.95rem 1.25rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const Message = styled.p<{ error?: boolean }>`
  color: ${({ error }) => (error ? "#b91c1c" : "#0f766e")};
  margin: 0.5rem 0 0;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;

  th,
  td {
    border-bottom: 1px solid #e2e8f0;
    padding: 0.9rem 0.75rem;
    text-align: left;
  }

  th {
    background: #f8fafc;
    font-weight: 600;
  }
`

export default function TasksPage(): JSX.Element {
  const [collections, setCollections] = useState<Collection[]>([])
  const [bankMovements, setBankMovements] = useState<BankMovement[]>([])
  const [history, setHistory] = useState<Collection[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [collectionForm, setCollectionForm] = useState({
    contract_id: "",
    mes_cobro: "",
    monto_cobro: "",
    moneda: "CLP",
  })

  const [bankForm, setBankForm] = useState({
    fecha: "",
    glosa: "",
    monto: "",
  })

  const [selectedMovement, setSelectedMovement] = useState<number | null>(null)
  const [allocationAmounts, setAllocationAmounts] = useState<Record<number, string>>({})

  const isReconcileDisabled = selectedMovement === null || Object.values(allocationAmounts).every((value) => !value)

  const fetchAll = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const [collectionsRes, movementsRes, historyRes] = await Promise.all([
        fetch(`${TASKS_BASE}/collections/`),
        fetch(`${TASKS_BASE}/bank-movements/`),
        fetch(`${TASKS_BASE}/collections/history/?status=${statusFilter}`),
      ])

      if (!collectionsRes.ok || !movementsRes.ok || !historyRes.ok) {
        throw new Error("Unable to load backend data")
      }

      const [collectionsData, movementsData, historyData] = await Promise.all([
        collectionsRes.json(),
        movementsRes.json(),
        historyRes.json(),
      ])

      setCollections(collectionsData)
      setBankMovements(movementsData)
      setHistory(historyData)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [statusFilter])

  const handleCollectionSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${TASKS_BASE}/collections/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_id: Number(collectionForm.contract_id),
          mes_cobro: collectionForm.mes_cobro,
          monto_cobro: collectionForm.monto_cobro,
          moneda: collectionForm.moneda,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Error creando collection")
      }

      setCollectionForm({ contract_id: "", mes_cobro: "", monto_cobro: "", moneda: "CLP" })
      await fetchAll()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleBankSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${TASKS_BASE}/bank-movements/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: bankForm.fecha,
          glosa: bankForm.glosa,
          monto: bankForm.monto,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Error creando bank movement")
      }

      setBankForm({ fecha: "", glosa: "", monto: "" })
      await fetchAll()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleAllocationChange = (collectionId: number, value: string) => {
    setAllocationAmounts((prev) => ({
      ...prev,
      [collectionId]: value,
    }))
  }

  const handleReconcile = async () => {
    if (selectedMovement === null) return

    setLoading(true)
    setError(null)

    try {
      const allocations = Object.entries(allocationAmounts)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([collectionId, amount]) => ({
          collection: Number(collectionId),
          bank_movement: selectedMovement,
          amount_clp: amount,
        }))

      for (const allocation of allocations) {
        const response = await fetch(`${TASKS_BASE}/collection-payments/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allocation),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.detail || "Error en conciliación")
        }
      }

      setAllocationAmounts({})
      await fetchAll()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const unpaidCollections = useMemo(
    () => collections.filter((collection) => !collection.is_paid),
    [collections],
  )

  return (
    <Wrapper>
      <Title>Conciliación de pagos</Title>

      <Grid>
        <Card>
          <Subtitle>Crear Collection</Subtitle>
          <form onSubmit={handleCollectionSubmit}>
            <FormRow>
              <Input
                placeholder="Contract ID"
                type="number"
                value={collectionForm.contract_id}
                onChange={(event) => setCollectionForm((prev) => ({ ...prev, contract_id: event.target.value }))}
                required
              />
              <Input
                placeholder="Mes de cobro"
                type="date"
                value={collectionForm.mes_cobro}
                onChange={(event) => setCollectionForm((prev) => ({ ...prev, mes_cobro: event.target.value }))}
                required
              />
              <Input
                placeholder="Monto"
                type="text"
                value={collectionForm.monto_cobro}
                onChange={(event) => setCollectionForm((prev) => ({ ...prev, monto_cobro: event.target.value }))}
                required
              />
              <Select
                value={collectionForm.moneda}
                onChange={(event) => setCollectionForm((prev) => ({ ...prev, moneda: event.target.value }))}
              >
                <option value="CLP">CLP</option>
                <option value="UF">UF</option>
              </Select>
            </FormRow>

            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Collection"}
            </Button>
          </form>
        </Card>

        <Card>
          <Subtitle>Crear BankMovement</Subtitle>
          <form onSubmit={handleBankSubmit}>
            <FormRow>
              <Input
                placeholder="Fecha"
                type="date"
                value={bankForm.fecha}
                onChange={(event) => setBankForm((prev) => ({ ...prev, fecha: event.target.value }))}
                required
              />
              <Input
                placeholder="Glosa"
                type="text"
                value={bankForm.glosa}
                onChange={(event) => setBankForm((prev) => ({ ...prev, glosa: event.target.value }))}
              />
              <Input
                placeholder="Monto CLP"
                type="text"
                value={bankForm.monto}
                onChange={(event) => setBankForm((prev) => ({ ...prev, monto: event.target.value }))}
                required
              />
            </FormRow>

            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear BankMovement"}
            </Button>
          </form>
        </Card>
      </Grid>
      
      <Card>
        <Subtitle>Conciliación</Subtitle>
        <FormRow>
          <Select
            value={selectedMovement ?? ""}
            onChange={(event) => setSelectedMovement(Number(event.target.value) || null)}
          >
            <option value="">Selecciona un BankMovement</option>
            {bankMovements.map((movement) => (
              <option key={movement.bank_movement_id} value={movement.bank_movement_id}>
                {movement.fecha} — {movement.glosa || "Sin glosa"} — disponible {movement.available_amount} CLP
              </option>
            ))}
          </Select>
        </FormRow>

        {selectedMovement !== null && (
          <>
            <Subtitle>Asignar montos a cobros</Subtitle>
            <Table>
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Mes</th>
                  <th>Moneda</th>
                  <th>Monto</th>
                  <th>Falta</th>
                  <th>Abono CLP</th>
                </tr>
              </thead>
              <tbody>
                {unpaidCollections.map((collection) => (
                  <tr key={collection.collection_id}>
                    <td>{collection.contract_id}</td>
                    <td>{collection.mes_cobro}</td>
                    <td>{collection.moneda}</td>
                    <td>{collection.monto_cobro}</td>
                    <td>{collection.remaining_amount}</td>
                    <td>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={allocationAmounts[collection.collection_id] ?? ""}
                        onChange={(event) => handleAllocationChange(collection.collection_id, event.target.value)}
                        placeholder="CLP"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <Button onClick={handleReconcile} disabled={loading || isReconcileDisabled}>
              {loading ? "Guardando..." : "Enviar conciliación"}
            </Button>
          </>
        )}
      </Card>

      <Card>
        <Subtitle>Histórico de cobros</Subtitle>
        <FormRow>
          <Select value={statusFilter} onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
    setStatusFilter(event.target.value as "all" | "pending" | "paid")
  }>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
          </Select>
        </FormRow>

        <Table>
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Mes</th>
              <th>Moneda</th>
              <th>Monto</th>
              <th>Pagado</th>
              <th>Falta</th>
              <th>Pagos</th>
            </tr>
          </thead>
          <tbody>
            {history.map((collection) => (
              <tr key={collection.collection_id}>
                <td>{collection.contract_id}</td>
                <td>{collection.mes_cobro}</td>
                <td>{collection.moneda}</td>
                <td>{collection.monto_cobro}</td>
                <td>{collection.paid_amount_in_currency}</td>
                <td>{collection.remaining_amount}</td>
                <td>
                  {collection.payments.length === 0 ? (
                    "Sin pagos"
                  ) : (
                    <ul>
                      {collection.payments.map((payment) => (
                        <li key={payment.id}>
                          {payment.bank_movement_date} · {payment.bank_movement_glosa} · {payment.amount_clp} CLP
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      
      {error && <Message error>{error}</Message>}
      {loading && !error && <Message>Cargando...</Message>}
    </Wrapper>
  )
}