# Backend Engineering Standards & Conventions

## Code Style
- Apply **Google Java Style Guide** for all Java code
- Use IntelliJ IDEA formatter: `Ctrl+Alt+L` (Win/Linux) or `Cmd+Option+L` (Mac)
- Checkstyle is enforced in CI/CD — non-compliant code fails the pipeline
- Never use `System.out.println()` — use SLF4J/Logback only
- Prefer Java Streams for collections processing (map/filter/collect). Avoid imperative loops (`for`, `while`, `for-each`) when a Stream provides equal or better readability. Do not use `for-each` for transformations or business logic.
- Extract repetitive or conditional update logic into dedicated private methods. Keep main business methods concise and readable.
- Main service methods should contain orchestration logic only. Move detailed mapping, validation, update, and transformation logic into private helper methods whenever possible.
- Extract builder creation logic into dedicated private factory/helper methods instead of building complex objects inline.
- Prefer `var` for local variable declarations when the type is obvious from the right side and readability is improved.
- Avoid using `var` when it reduces clarity or makes the type ambiguous.
- Prefer static imports for commonly used utility methods, assertions, collectors, and constants when readability improves.
- Avoid excessive static imports that reduce code clarity or create ambiguity.
- Preserve consistent whitespace and vertical spacing for readability. Add empty lines between logical code blocks (validation, mapping, conditionals, persistence, returns, etc.). Do not compress unrelated statements into dense blocks.
- Do not use Java `record` for DTOs. Always use regular classes with Lombok annotations:
  - `@Data`
  - `@Builder`
  - `@AllArgsConstructor`
  - `@NoArgsConstructor`
- In service classes, always inject the **service layer** of another domain, never its repository directly. A repository may only be injected into the service that owns the same domain — for example, `AccountRepository` is acceptable in `AccountService`, but must not be injected into `PaymentService` or any other unrelated service.
- Use @RequiredArgsConstructor (Lombok) for constructor injection. Declare dependencies as private final fields — do not use field injection (@Autowired on fields) or write an explicit constructor by hand.
```

---

## Project Structure

```
az.{squadName}.{projectName}/
├── config/           # General config & beans (properties/ subfolder for config classes)
├── client/           # External service/API integrations (new services only — not common lib)
├── controller/       # REST endpoints only — no business logic here
├── exception/        # GlobalExceptionHandler + ErrorCode
├── annotation/       # Custom annotations (validation, logging, authorization)
├── mapper/           # Entity ↔ DTO mapping
├── model/
│   ├── request/      # @RequestBody classes (e.g. CreatePaymentRequest)
│   ├── response/     # API response classes (e.g. PaymentResponse)
│   ├── dto/          # Inter-layer data transfer; can be composed (e.g. OrderDto with List<OrderItemDto>)
│   ├── enums/        # Status, type, category enums (singular form: PaymentStatus)
│   ├── constants/    # Static constant values (e.g. PaymentConstants.MAX_AMOUNT)
│   ├── criteria/     # Search/filter parameters (e.g. PaymentSearchCriteria)
│   ├── context/      # Transient operation state/metadata passed across methods
│   ├── param/        # Method parameter grouping objects
│   ├── event/        # Async/messaging events (Kafka, RabbitMQ)
│   └── projection/   # JPA selective field projections for performance
├── service/          # Business logic: interfaces + handler/ (implementations)
├── util/             # Stateless helper methods
└── dao/
    ├── entity/       # JPA entities
    └── repository/   # Spring Data repositories
```

### Package Pattern
```
az.{squadName}.{projectName}
# squadName always concatenated: az.pulz, az.pg, az.cards
# projectName can be concatenated (az.pulz.openbanking) or hierarchical (az.pulz.open.banking)
```

### Service Layer Pattern
- **Interface**: `{Name}Service` — defines the contract
- **Implementation**: `{Name}ServiceHandler` or `{Name}ServiceImpl`
- Use **simple structure** (all interfaces in `service/`, handlers in `service/handler/`) for ≤10 services
- Use **grouped structure** (subfolders by domain: `service/order/`, `service/payment/`) for 10+ services

### Tests (Spock/Groovy)
```
src/test/groovy/az/{squad}/{project}/
├── controller/   # *Spec.groovy
├── service/
├── mapper/
└── util/
src/test/resources/
├── application-test.yml
└── test-data/    # JSON/YAML test fixtures
```

---

## Naming Conventions

| Type | Format | Example |
|---|---|---|
| Entity | `{Name}Entity` | `PaymentEntity` |
| DTO | `{Name}Dto` | `PaymentDto` |
| Request | `{Name}Request` | `CreatePaymentRequest` |
| Response | `{Name}Response` | `PaymentResponse` |
| Controller | `{Name}Controller` | `PaymentController` |
| Service (interface) | `{Name}Service` | `PaymentService` |
| Service (impl) | `{Name}ServiceHandler` / `ServiceImpl` | `PaymentServiceHandler` |
| Repository | `{Name}Repository` | `PaymentRepository` |
| Mapper | `{Name}Mapper` | `PaymentMapper` |
| Client | `{Name}Client` | `BankServiceClient` |
| Exception | `{Name}Exception` | `PaymentNotFoundException` |
| Config | `{Name}Config` | `SecurityConfig` |
| Properties | `{Name}Properties` | `PaymentProperties` |
| Enum | `{Name}` (singular) | `PaymentStatus`, `Currency` |
| Constants | `{Name}Constants` | `PaymentConstants` |
| Util | `{Name}Util` | `DateUtil`, `JsonUtil` |
| Builder | `{Name}Builder` | `TestBuilder` |
| Criteria | `{Name}Criteria` | `PaymentSearchCriteria` |
| Context | `{Name}Context` | `PaymentContext` |
| Param | `{Name}Param` | `PaymentProcessParam` |
| Event | `{Name}Event` | `PaymentCreatedEvent` |
| Projection | `{Name}Projection` | `PaymentSummaryProjection` |

### Method Naming
- `camelCase`; name must clearly express intent: `calculateTotalAmount()`, `findByUserId()`
- Boolean returns: start with `is`, `has`, `can`: `isActive()`, `hasPermission()`
- CRUD prefixes: `create`, `get`, `update`, `delete`

### Variable & Constant Naming
- Variables: `camelCase` — `paymentAmount`, `userId`
- Constants: `UPPER_SNAKE_CASE` — `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`
- Avoid single-letter names (except loop variables `i`, `j`)

### Package Naming
- All lowercase, single word: `controller`, `service`, `model`
- No camelCase or underscores in package names

---

## Microservice Naming

| Pattern | When to Use | Example |
|---|---|---|
| `ms-{domain}-service` | Has business logic (CRUD, validation, calculation) | `ms-payment-service` |
| `ms-{domain}-proxy` | Forwards requests as-is, minimal transformation | `ms-bank-proxy` |
| `ms-{domain}-adapter` | Transforms external format to internal, no business rules | `ms-bank-adapter` |
| `ms-{domain}-gateway` | Cross-cutting: routing, auth, rate-limiting | `ms-partner-gateway` |

---

## Git & Branching Strategy

### Branch Naming
| Type | Format | Example |
|---|---|---|
| Feature | `feature/{taskid}_short-desc` | `feature/PAY-123-add-refund-api` |
| Bug fix | `bugfix/{taskid}_short-desc` | `bugfix/PAY-456-fix-null-pointer` |
| Hotfix | `hotfix/{taskid}_short-desc` | `hotfix/PAY-789-fix-prod-crash` |
| Refactor | `refactor/{taskid}_short-desc` | `refactor/PAY-321-extract-payment-validator` |
| Release | `release/{version}` | `release/1.2.0` |

### Commit Message Format (Conventional Commits)
```
<type>(<scope>): <short description>

[Optional body]
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`

Examples:
```
feat(payment): add refund endpoint for partial amounts
fix(auth): resolve token expiration race condition
refactor(order): extract validation logic to separate service
```

### Merge Strategy
- Feature branches → `develop`: **squash merge** (keeps history clean)
- `develop` → `main`: **merge commit**
- Force push is **forbidden** on: `test`, `develop`, `stage`, `main`, `master`

---

## Logging Standards

| Level | When | Example Use Case |
|---|---|---|
| `ERROR` | System error, user affected | Exceptions, external service failures |
| `WARN` | Potential problem, system still running | Retry triggered, deprecated API called |
| `INFO` | Key business events | Payment completed, user created |
| `DEBUG` | Detailed dev info | Request/response details, intermediate calculations |

### Rules
- **Log format**: `ActionLog.methodName : message`
- **Structured logging**: use `{}` placeholders — never string concatenation with `+`
- **Exception logging**: exception always last parameter so stack trace appears
- **Sensitive data** (passwords, card numbers, personal info): NEVER log at any level
- Log messages in **English**
- `System.out.println()` is **forbidden**

```java
// ✅ Correct
log.info("ActionLog.createPayment : Payment created successfully, paymentId={}", paymentId);
log.error("ActionLog.processRefund : Refund failed, orderId={}", orderId, exception);

// ❌ Wrong
log.info("Payment created: {}", paymentId);          // Missing ActionLog format
log.error("Something went wrong");                   // No context
```

---

## Exception Handling

### Principles
- All custom exceptions extend `RuntimeException` — no checked exceptions
- Every exception must have a corresponding `ErrorCode`
- Exceptions are thrown **only in the service layer** — not in controller or dao
- Avoid catch-all `Exception` — catch specific types only
- Use generic, reusable exception names; differentiate via `ErrorCode`

```java
// ❌ Wrong — separate exception per entity
throw new UserNotFoundException("User not found");
throw new PaymentNotFoundException("Payment not found");

// ✅ Correct — generic exception + ErrorCode
throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
throw new NotFoundException(ErrorCode.PAYMENT_NOT_FOUND);
throw new NotFoundException(ErrorCode.ORDER_NOT_FOUND);
```

### Exception Hierarchy
```java
// Base
public abstract class BaseException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Map<String, Object> details;
}

// Concrete
public class NotFoundException extends BaseException { ... }
public class ValidationException extends BaseException { ... }
public class ServiceException extends BaseException { ... }
```

### ErrorCode Structure
```java
public enum ErrorCode {
    PAYMENT_NOT_FOUND("PAYMENT_NOT_FOUND", "Payment not found", HttpStatus.NOT_FOUND),
    INSUFFICIENT_BALANCE("INSUFFICIENT_BALANCE", "Insufficient balance", HttpStatus.BAD_REQUEST),
    EXTERNAL_SERVICE_ERROR("EXTERNAL_SERVICE_ERROR", "External service unavailable", HttpStatus.SERVICE_UNAVAILABLE);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}
```

### ErrorResponse Structure
```java
@Getter @Builder
public class ErrorResponse {
    private String code;
    private String message;
    private Map<String, Object> details;
    private LocalDateTime timestamp;
}
```

Response example:
```json
{
  "code": "PAYMENT_NOT_FOUND",
  "message": "Payment not found",
  "details": { "paymentId": "abc-123" },
  "timestamp": "2025-02-07T10:30:00Z"
}
```

- All exceptions handled centrally via `@RestControllerAdvice`

---

## API Design Conventions

### Endpoint Naming
- Lowercase + hyphens only: `/api/v1/payment-orders`
- Resource names in plural: `/users`, `/payments`, `/transactions`
- Nested resources: `/users/{userId}/orders`
- Versioning in URL path: `/api/v1/`, `/api/v2/`

### HTTP Methods
| Operation | Method | Example |
|---|---|---|
| Create | `POST` | `POST /api/v1/payments` |
| Read (single) | `GET` | `GET /api/v1/payments/{id}` |
| Read (list) | `GET` | `GET /api/v1/payments?status=ACTIVE` |
| Full update | `PUT` | `PUT /api/v1/payments/{id}` |
| Partial update | `PATCH` | `PATCH /api/v1/payments/{id}` |
| Delete | `DELETE` | `DELETE /api/v1/payments/{id}` |

### HTTP Status Codes
| Code | Use |
|---|---|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation error, bad request |
| `401 Unauthorized` | Authentication failed |
| `403 Forbidden` | No authorization |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Duplicate or conflict |
| `500 Internal Server Error` | Unexpected server error |

---

## Testing Standards

- Framework: **Spock/Groovy** — readable `given-when-then` format, less boilerplate than JUnit
- Every new feature and bugfix **must** have a test
- Tests must be **independent** — execution order must not affect results
- External services are **mocked** — no real API calls during tests
- Use **Builder pattern** for test data (`TestBuilder` classes)

### Test Naming
```groovy
def "methodName : should do X when Y condition"() { ... }
def "getUserId : should return payment when valid id is provided"() { ... }
def "getUserId : should throw exception when balance is insufficient"() { ... }
```

### Test Structure
```groovy
def "calculateTotal : should calculate total with discount"() {
    given:
    def order = new Order(amount: 100, discount: 10)

    when:
    def result = service.calculateTotal(order)

    then:
    result == 90
}
```

---

## Dependency & Library Management

- All dependency versions stored as variables in `gradle.properties` — no hardcoded versions in `build.gradle`
- Regularly clean up unused dependencies

```properties
# gradle.properties
springBootVersion=3.2.5
spockVersion=2.4-groovy-4.0
lombokVersion=1.18.32
mapstructVersion=1.5.5.Final
```

---

## Security Practices

- **Secrets** (passwords, API keys, tokens): never in code or repository — use **Vault only**
- **Input validation**: apply on all controller endpoints — `@Valid`, `@NotNull`, `@Size`, etc.
- **SQL Injection**: use only parameterized queries or JPA/Hibernate — raw string SQL with concatenation is forbidden
- **Sensitive data**: must not appear in logs, responses, or error messages
- **Dependency vulnerabilities (CVE)**: automated scanning in CI/CD (OWASP Dependency Check or Snyk)

---

## Code Smells & Anti-patterns to Avoid

| Anti-pattern | Problem | Solution |
|---|---|---|
| Magic numbers | `if (status == 3)` — what is 3? | Use enum or constant |
| Hardcoded values | URLs, timeouts, limits in code | Use `application.yml` or Properties class |
| God class | One class doing too much (500+ lines) | Split by Single Responsibility |
| Long method | Method is 30+ lines | Break into smaller focused methods |
| Catch & ignore | `catch (Exception e) {}` — error swallowed | At minimum log it; rethrow if needed |
| Copy-paste code | Same logic repeated in multiple places | Extract to shared util/service |
| Business logic in controller | Validation/calculation in controller | Move to service layer |
| Returning null | `return null` — NullPointerException risk | Use `Optional` or throw exception |

---

## API Documentation (Swagger / OpenAPI)

- All REST endpoints documented via **SpringDoc OpenAPI (Swagger UI)**
- Each microservice has its own SpringDoc config class
- Swagger UI active only on `test`, `dev`, `staging` — **disabled in production**

```yaml
# application-dev.yml
springdoc:
  api-docs:
    enabled: true
  swagger-ui:
    enabled: true

# application-prod.yml
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false
```

---

## Database Schema Design & Naming

### Schema Isolation
- All microservices share one database but each has its **own schema**
- Schema name derived from service name: `ms-payment-service` → `ms_payment_service`
- Schema must be created before first deploy (by DBA/DevOps)
- **Cross-schema queries are forbidden** — services only access their own schema
- Cross-service data sharing only via **REST API or message queue (Kafka, RabbitMQ)**

### Naming Pattern
```
Microservice:  ms-{domain}-service
Schema:        ms_{domain}_service
Tables:        ms_{domain}_service.{table_name}
```

### Entity Annotation
```java
@Entity
@Table(name = "transactions", schema = "ms_payment_service")
public class TransactionEntity { ... }
```

### Naming Convention
```java
// ✅ Correct — snake_case
@Table(name = "payment_transactions", schema = "ms_payment_service")
@Column(name = "created_at")
@Column(name = "user_id")

// ❌ Wrong — camelCase in DB
@Table(name = "paymentTransactions")
@Column(name = "createdAt")
```

### DDL Auto Strategy
- **Never** use `ddl-auto: update`, `create`, or `create-drop` in dev/stage/production
- Always use `ddl-auto: none`; schema changes managed via migration scripts

---

## Technical Debt Tracking

```java
// TODO: [TASK-ID] Short description
// TODO: PAY-456 Replace retry mechanism with exponential backoff
```

- Every `// TODO` **must** have a Jira/task ID — no ID = rejected in code review
- Do NOT use `// FIXME`, `// HACK`, `// XXX` — only `// TODO` is standard
- Technical debt tasks tracked in backlog with `tech-debt` label
- Allocate time for tech debt in sprint planning

---

## README Requirements

Every microservice must have a `README.md` in the root with sections:
- **Overview** — service description and purpose
- **Features** — list of main functionalities
- **Tech Stack** — technologies and versions used
- **API Documentation** — Swagger UI links (dev, stage)

---

## Confluence Documentation

Every service must have a Confluence technical document with:
- **API Endpoints** — all endpoints, HTTP methods, short descriptions
- **Request Structures** — headers, request body, parameters, field descriptions (type, required/optional, allowed values)
- **Response Structures** — successful response formats and examples
- **Error Codes** — service-specific ErrorCodes, HTTP statuses, example error responses
