# Prueba Técnica Fullstack

Stack: Django + DRF + PostgreSQL + Docker + Next.js

## Objetivo

Construir un módulo de conciliación de pagos de arriendo con flujo completo:

```txt
Frontend (Next.js) -> API (Django) -> PostgreSQL -> Frontend
```

Buscamos ver cómo modelas un dominio real, cómo estructuras el backend y el frontend,
y qué criterio aplicas cuando el enunciado no lo define todo. Puedes (y se espera que)
uses IA, pero evaluamos tu pensamiento crítico sobre lo que produce.

## Requisitos previos

- Docker Desktop
- Python 3.11+
- Node.js 20+
- Yarn
- PDM

## Setup

### 1) Base de datos

```bash
docker compose --file "docker-compose.yml" up -d
```

### 2) Backend

```bash
cd backend
cp .env.example .env
pdm install
pdm migrate
pdm dev
```

Backend: `http://localhost:8000`

### 3) Frontend

```bash
cd frontend
cp .env.example .env.local
yarn install
yarn dev
```

Frontend: `http://localhost:3000/tasks`

## Contexto del dominio

Cada mes generamos los cobros de arriendo
de cada contrato, y por otro lado recibimos transferencias bancarias reales. El trabajo
operativo consiste en **conciliar**: decidir qué transferencias pagan qué cobros.

Dos conceptos:

- **Collection**: un monto mensual cobrado por arriendo. Tiene una moneda propia
(CLP o UF). Ejemplo: el arriendo de abril 2026 del contrato 123, por UF 2.
  ```json
  {
    "contract_id": 123,
    "mes_cobro": "2026-04-01",
    "monto_cobro": 2,
    "moneda": "UF"
  }
  ```
- **BankMovement**: una transferencia real recibida. **Siempre en CLP**, monto > 0.

La relación entre ambos es de many-to-many:

- Un cobro puede pagarse en varias transferencias (pago parcial / fraccionado).
- Una transferencia puede pagar varios cobros.

## Reglas de negocio

- **Conversión de moneda**: las transferencias siempre llegan en CLP. Para pagar un
cobro en UF, usa una **UF fija de $40.000**.
- **Cuánto falta por pagar** se determina comparando lo abonado contra el monto del
cobro, **en la moneda original del cobro**. No basta con sumar pesos: un cobro en UF
está pagado cuando lo abonado equivale a su monto en UF.
- **Sobrepagos**: si una transferencia aporta más de lo que el cobro necesita, el  
excedente queda como **saldo a favor** (no se pierde, no bloquea la operación).

## Modelos

Estos son los campos **mínimos**. Puedes (y probablemente necesitarás) agregar modelos y campos adicionales.

`Collection`

- `collection_id`
- `contract_id`
- `mes_cobro`
- `monto_cobro`
- `moneda` (CLP o UF)

`BankMovement`

- `bank_movement_id`
- `fecha`
- `glosa`
- `monto` (CLP, > 0)

## Backend

Implementar modelos, migraciones, serializers, views y urls.

Como mínimo, la API debe permitir:

- Crear y listar `Collection`.
- Crear y listar `BankMovement`.
- Asociar **un** `BankMovement` a uno o más `Collection` para pagarlos
(incluyendo pagos parciales).
- Consultar el histórico de cobros, distinguiendo los pendientes de los pagados, y
para los que tienen pagos, el detalle de qué transferencias los pagaron y con cuánto.

El diseño de rutas y recursos es tuyo. Mantén el alcance funcional descrito.

## Frontend

Implementar como mínimo:

- Crear `Collection` y `BankMovement`.
- Flujo de conciliación: tomar un `BankMovement` y asignarlo a uno o más cobros,
indicando cuánto se abona a cada uno.
- Histórico de cobros: pendientes y pagados, y para cada cobro con pagos, el detalle
de su pago (qué transferencias, cuánto cada una).
- Loading y error básico.

## Reglas técnicas

- Usar `NEXT_PUBLIC_API_URL`.
- Usar `styled-components`.
- En TypeScript, no usar `any`.
- No cambiar el setup base del repositorio.

## Entregables

1. Código funcional.
2. Lista de funcionalidades implementadas y pendientes.
3. Breve explicación del flujo de datos end-to-end.
4. **Supuestos y preguntas**: lista los supuestos que tomaste donde el enunciado no era
  explícito, y las preguntas que le harías al equipo de producto antes de llevar esto
   a producción.

