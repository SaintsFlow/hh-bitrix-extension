# API Examples - HH Resume Exporter

Примеры API запросов для интеграции с расширением HH Resume Exporter.

## 🔐 Аутентификация

Все запросы требуют авторизации через Bearer токен:

```http
Authorization: Bearer your_api_token_here
```

## 📡 API Endpoints

### 1. Получение данных сотрудника

**Запрос:**

```http
GET /api/employee/data
Authorization: Bearer abc123token456
```

**Успешный ответ:**

```json
{
  "success": true,
  "data": {
    "employee": {
      "id": 1,
      "name": "Анна Иванова",
      "email": "anna.ivanova@company.com",
      "position": "HR Manager",
      "phone": "+7 495 123 45 67",
      "is_active": true,
      "created_at": "2025-06-08T06:17:27.000000Z",
      "last_login_at": "2025-06-08T07:22:24.000000Z"
    },
    "client": {
      "id": 1,
      "name": "ООО Технологии Будущего",
      "subscription_start_date": "2025-06-08T00:00:00.000000Z",
      "subscription_end_date": "2026-06-08T00:00:00.000000Z",
      "is_active": true,
      "subscription_expires_in_days": 365,
      "max_employees": 10,
      "current_employees_count": 3
    },
    "token_info": {
      "name": "employee-token",
      "created_at": "2025-06-08T06:17:29.000000Z",
      "last_used_at": "2025-06-08T07:22:24.000000Z"
    }
  }
}
```

**Ошибка авторизации:**

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

**Неактивная подписка:**

```json
{
  "success": false,
  "message": "Subscription expired",
  "error": "Company subscription has expired"
}
```

### 2. Отправка резюме

**Запрос:**

```http
POST /api/employee/submit-resume
Authorization: Bearer abc123token456
Content-Type: multipart/form-data
```

**Параметры формы:**

```
candidate_name: Иван Петров
candidate_phone: +7 916 123 45 67
candidate_email: ivan.petrov@example.com
position: Frontend разработчик
resume_file: [PDF FILE BINARY DATA]
```

**Успешный ответ:**

```json
{
  "success": true,
  "message": "Резюме успешно добавлено",
  "data": {
    "resume_id": 12345,
    "candidate_id": 67890,
    "created_at": "2025-06-08T12:30:45.000000Z"
  }
}
```

**Ошибка валидации:**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "candidate_name": "Имя кандидата обязательно",
    "candidate_email": "Неверный формат email"
  }
}
```

**Превышение лимита:**

```json
{
  "success": false,
  "message": "Employee limit exceeded",
  "error": "Company has reached maximum number of employees"
}
```

## 🧪 Примеры cURL запросов

### Проверка токена

```bash
curl -X GET "http://localhost:8000/api/employee/data" \
  -H "Authorization: Bearer your_token_here" \
  -H "Accept: application/json"
```

### Отправка резюме с файлом

```bash
curl -X POST "http://localhost:8000/api/employee/submit-resume" \
  -H "Authorization: Bearer your_token_here" \
  -F "candidate_name=Иван Петров" \
  -F "candidate_phone=+7 916 123 45 67" \
  -F "candidate_email=ivan.petrov@example.com" \
  -F "position=Frontend разработчик" \
  -F "resume_file=@/path/to/resume.pdf"
```

### Отправка резюме без файла

```bash
curl -X POST "http://localhost:8000/api/employee/submit-resume" \
  -H "Authorization: Bearer your_token_here" \
  -F "candidate_name=Анна Сидорова" \
  -F "candidate_phone=+7 495 987 65 43" \
  -F "candidate_email=anna.sidorova@gmail.com" \
  -F "position=UX/UI Designer"
```

## 🔧 Примеры реализации (PHP Laravel)

### Controller для получения данных сотрудника

```php
<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class EmployeeController extends Controller
{
    public function getData(Request $request)
    {
        $employee = $request->user(); // Получаем из middleware
        $client = $employee->client;
        $token = $request->bearerToken();

        return response()->json([
            'success' => true,
            'data' => [
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'position' => $employee->position,
                    'phone' => $employee->phone,
                    'is_active' => $employee->is_active,
                    'created_at' => $employee->created_at,
                    'last_login_at' => $employee->last_login_at,
                ],
                'client' => [
                    'id' => $client->id,
                    'name' => $client->name,
                    'subscription_start_date' => $client->subscription_start_date,
                    'subscription_end_date' => $client->subscription_end_date,
                    'is_active' => $client->is_active,
                    'subscription_expires_in_days' => $client->subscription_expires_in_days,
                    'max_employees' => $client->max_employees,
                    'current_employees_count' => $client->employees()->count(),
                ],
                'token_info' => [
                    'name' => 'employee-token',
                    'created_at' => now(),
                    'last_used_at' => now(),
                ]
            ]
        ]);
    }

    public function submitResume(Request $request)
    {
        $request->validate([
            'candidate_name' => 'required|string|max:255',
            'candidate_email' => 'required|email',
            'candidate_phone' => 'nullable|string|max:50',
            'position' => 'required|string|max:255',
            'resume_file' => 'nullable|file|mimes:pdf|max:10240' // 10MB max
        ]);

        $employee = $request->user();

        // Проверяем лимиты компании
        if ($employee->client->current_employees_count >= $employee->client->max_employees) {
            return response()->json([
                'success' => false,
                'message' => 'Employee limit exceeded',
                'error' => 'Company has reached maximum number of employees'
            ], 403);
        }

        // Создаем запись кандидата
        $candidate = Candidate::create([
            'name' => $request->candidate_name,
            'email' => $request->candidate_email,
            'phone' => $request->candidate_phone,
            'position' => $request->position,
            'client_id' => $employee->client_id,
            'added_by' => $employee->id,
        ]);

        // Сохраняем файл резюме если есть
        if ($request->hasFile('resume_file')) {
            $file = $request->file('resume_file');
            $filename = 'resume_' . $candidate->id . '_' . time() . '.pdf';
            $path = $file->storeAs('resumes', $filename, 'public');

            $candidate->update(['resume_file_path' => $path]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Резюме успешно добавлено',
            'data' => [
                'resume_id' => $candidate->id,
                'candidate_id' => $candidate->id,
                'created_at' => $candidate->created_at,
            ]
        ]);
    }
}
```

### Middleware для авторизации

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Employee;

class EmployeeTokenAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
                'error' => 'Token is required'
            ], 401);
        }

        $employee = Employee::where('api_token', $token)
                           ->where('is_active', true)
                           ->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
                'error' => 'Invalid or expired token'
            ], 401);
        }

        // Проверяем активность подписки компании
        if (!$employee->client->is_active || $employee->client->subscription_end_date < now()) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription expired',
                'error' => 'Company subscription has expired'
            ], 403);
        }

        $request->setUserResolver(function () use ($employee) {
            return $employee;
        });

        // Обновляем время последнего использования токена
        $employee->update(['last_login_at' => now()]);

        return $next($request);
    }
}
```

### Routes (routes/api.php)

```php
<?php

use App\Http\Controllers\Api\EmployeeController;

Route::prefix('employee')->middleware('employee.token.auth')->group(function () {
    Route::get('/data', [EmployeeController::class, 'getData']);
    Route::post('/submit-resume', [EmployeeController::class, 'submitResume']);
});
```

## 🌐 CORS настройки

### Laravel (config/cors.php)

```php
<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'chrome-extension://*',
        'moz-extension://*',
        'http://localhost:3000', // для разработки
    ],
    'allowed_origins_patterns' => [
        '/^chrome-extension:\/\/.*/',
        '/^moz-extension:\/\/.*/',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

### Express.js

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: [
      /^chrome-extension:\/\/.*/,
      /^moz-extension:\/\/.*/,
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);
```

## 🧪 Тестирование API

### Создание тестового токена

```sql
-- Пример SQL для создания тестового токена
INSERT INTO employees (name, email, position, phone, api_token, client_id, is_active)
VALUES (
  'Test Employee',
  'test@company.com',
  'HR Manager',
  '+7 495 123 45 67',
  'test_token_abc123',
  1,
  true
);
```

### Тестовые данные для отправки

```json
{
  "candidate_name": "Иван Тестовый",
  "candidate_phone": "+7 916 555 12 34",
  "candidate_email": "ivan.test@example.com",
  "position": "Тестовая позиция"
}
```

---

_Документация API для HH Resume Exporter v2.0_
