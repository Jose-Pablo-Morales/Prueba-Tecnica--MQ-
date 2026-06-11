## Funcionalidades Backend

### Modelos
En primer lugar se implementaron los modelos descritos del enunciado:
#### -Collection, con metodos de conversion de moneda

#### -Bankmovement

Adicionalmente se añadio un modelo CollectionPayment, que asocia el pago con el contrato, la cual define el monto asociado al pago del contrato sin esta no se podria conciliaciar un pago parcial del contrato o varios contratos.

#### -CollectionPayment:  
    -collection: FK a Collection
    -bank_movement: FK a BankMovement
    -amount_clp: decimal positivo en CLP
    -created_at: fecha/hora de creación

### Serializers

#### CollectionPaymentSerializer

-Devuelve pagos aplicados: id, bank_movement, amount_clp, bank_movement_date, bank_movement_glosa, created_at.

#### CollectionSerializer

-Muestra Collection con estado y pagos: collection_id, contract_id, mes_cobro, monto_cobro, moneda, paid_amount_clp, paid_amount_in_currency, is_paid, remaining_amount, payments.

#### BankMovementSerializer

-Devuelve movimiento bancario con uso: bank_movement_id, fecha, glosa, monto, used_amount, available_amount, payments.

#### CollectionPaymentCreateSerializer

-Crea conciliación: collection, bank_movement, amount_clp.
Valida monto positivo, fondos disponibles y evita sobrepago.

### Vistas 

Se crean vistas para cada endpoint de la api.

#### CollectionListCreateView

##### -GET /api/tasks/collections/
##### -POST /api/tasks/collections/
-Permite listar todas las Collection y crear una nueva.

#### CollectionDetailView

##### -GET /api/tasks/collections/<int:collection_id>/int:collection_id/
-Retorna el detalle de una Collection, incluyendo su historial de pagos y estado de pago.

#### CollectionHistoryView

##### -GET /api/tasks/collections/history/?status=all|pending|paid
-Retorna el histórico de cobros
    -status=pending → solo cobros pendientes
    -status=paid → solo cobros pagados
    -status=all → todos los cobros
    -BankMovementListCreateView

##### -GET /api/tasks/bank-movements/
##### -POST /api/tasks/bank-movements/
-Lista todos los BankMovement y permite crear uno nuevo.

#### BankMovementDetailView

##### -GET /api/tasks/bank-movements/<int:bank_movement_id>/int:bank_movement_id/
-Retorna el detalle de un BankMovement, incluyendo los pagos asociados.

#### CollectionPaymentCreateView

##### -POST /api/tasks/collection-payments/
-Crea la conciliación entre un BankMovement y una o más Collection
Recibe collection, bank_movement y amount_clp

## Funcionalidad Frontend

### Carga datos desde la API:

##### -GET /api/tasks/collections/
##### -GET /api/tasks/bank-movements/
##### -GET /api/tasks/collections/history/?status=...

### Formulario de creación:

##### -Collection:

    -campos: contract_id, mes_cobro, monto_cobro, moneda
    envía POST /api/tasks/collections/

##### -BankMovement

    -campos: fecha, glosa, monto
    envía POST /api/tasks/bank-movements/

### Conciliación de pagos:

-Permite seleccionar un BankMovement

-Muestra cobros no pagados

-Permite asignar montos CLP por Collection

-Envía uno o varios POST /api/tasks/collection-payments/

### Historial y filtros:

-Selector all | pending | paid

-Muestra lista de collections con pagos, estado y monto restante

### UI:

-loading genérico

-muestra errores si la API falla

-deshabilita acciones mientras hay petición en curso

### Pendiente

Creo que puede haber faltado una vista completa de las Colleccions y BankMovements, si hay muchas puede ser engorrosa la seleccion Añadiría filtros por fecha y contrato. 
Si se intenta abonar a una Collection con mas dinero de lo que tiene el BankMovement, no se permitira la operacion, de igual forma si se intenta abonar mas dinero de lo que la Collection pide, tampoco se podrá. Se podria implementar un manejo de sobregiros de manera que si se abona mas de lo que se tiene, se abone el maximo del BankMovement, como tambien permitir abonar por sobre lo que pide la Collection, y dejarlo como credito. Crear tests.

## Flujo de datos

#### -Usuario → Frontend: interactúa con la UI (crear/seleccionar/asignar montos).

#### -Frontend → API: hace GET/POST a /api/tasks/collections/, /api/tasks/bank-movements/, /api/tasks/collection-payments/.

#### -API → BD: DRF valida/serializa y persiste en los modelos Collection, BankMovement, CollectionPayment.

#### -Respuesta → Frontend: backend devuelve datos actualizados; frontend refresca listas y muestra historial.

## Supuestos y preguntas

De manera general se asume que la transferencia en si no contiene informacion a que contrato ni que mes se hace el pago. Se asume todo como un proceso manual. 

Tambien se asume un modelo sin "arrendatario-propietario", es decir anonimo. 

Tambien se asumen pagos asincronicos, no importan las fechas de la colecta ni de la transferencia.

Antes de producción, resolveria todos estos supuestos con la necesidad real del la plataforma. Ademas preguntaría:

Quien va a ser el usuario de esto, esta misma empresa, propietarios?

Que pasa si se realizan mas cobros en un mes, se permite?

Que pasa si el usuario necesita asociar muchos pagos pequeños a un a colecta? Se podria implementar una agrupación?

Pueden existir pagos "fantasma"?

Existirán plazos de tiempo para los cobros?

Se puede escalar a una asociacion automatica de transferencia y cobro?

Es el formato del front adecuado, existen reduncancias? falta informacion que mostrar? Es el orden correcto?










