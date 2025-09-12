# API Documentation

This directory contains documentation for all API endpoints in the Salaryman application.

## API Structure

The application uses Next.js API routes located in the `src/app/api` directory. Here are the main API categories:

### Reports API
**Endpoint**: `/api/reports`
- **GET**: Fetch financial reports and analytics
  - Query Parameters:
    - `startDate`: Start date for the report (YYYY-MM-DD)
    - `endDate`: End date for the report (YYYY-MM-DD)
    - `type`: Report type ('income', 'expense', 'all')
  - Response: Transaction summary and analytics data

### Recurring Payments API
**Endpoint**: `/api/recurring/upcoming`
- **GET**: Fetch upcoming recurring payments
  - Query Parameters:
    - `days`: Number of days to look ahead (default: 30)
  - Response: List of upcoming payments with due dates

### Transaction APIs
**Base Path**: `/api/transactions`

1. **Create Transaction**
   - Method: POST
   - Path: `/api/transactions`
   - Body:
     ```typescript
     {
       amount: number
       type: 'income' | 'expense'
       date: string
       categoryId: number
       description?: string
       accountId?: number
       creditCardId?: number
       recurringId?: number
     }
     ```

2. **Get Transactions**
   - Method: GET
   - Path: `/api/transactions`
   - Query Parameters:
     - `startDate`: Start date
     - `endDate`: End date
     - `type`: Transaction type
     - `categoryId`: Filter by category

## Authentication

All API routes are protected using Clerk authentication. Each request must include a valid authentication token in the Authorization header.

## Error Handling

API responses follow this structure for errors:
```typescript
{
  error: {
    message: string
    code: string
    details?: any
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication failed
- `INVALID_INPUT`: Invalid request parameters
- `NOT_FOUND`: Requested resource not found
- `SERVER_ERROR`: Internal server error

## Rate Limiting

API requests are rate-limited to:
- 100 requests per minute for normal operations
- 300 requests per minute for read operations
- 50 requests per minute for write operations
