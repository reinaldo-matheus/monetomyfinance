# Auth Testing Playbook — FinançasPro

## Mongo
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
```
Verify bcrypt hash starts with `$2b$`. Check indexes: users.email (unique), login_attempts.identifier, password_reset_tokens.expires_at.

## API
Use external URL ${REACT_APP_BACKEND_URL}/api.
```
curl -c /tmp/c.txt -X POST $URL/api/auth/register -H "Content-Type: application/json" -d '{"email":"u@x.com","password":"123456"}'
curl -c /tmp/c.txt -X POST $URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"u@x.com","password":"123456"}'
curl -b /tmp/c.txt $URL/api/auth/me
curl -b /tmp/c.txt -X POST $URL/api/transactions -H "Content-Type: application/json" -d '{"type":"receita","description":"Salário","value":5000,"category":"Salário","date":"2026-01-15"}'
curl -b /tmp/c.txt $URL/api/transactions
curl -b /tmp/c.txt -X POST $URL/api/goals -H "Content-Type: application/json" -d '{"name":"Viagem","emoji":"✈️","target":5000,"saved":500,"deadline":"2026-06-30"}'
curl -b /tmp/c.txt $URL/api/goals
```

## Credentials
- Admin: admin@financaspro.com / admin123
