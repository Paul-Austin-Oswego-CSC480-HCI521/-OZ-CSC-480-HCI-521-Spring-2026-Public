db = db.getSiblingDB('appdb');

db.createUser({
  user: 'appuser',
  pwd: 'secret123',
  roles: [{ role: 'readWrite', db: 'appdb' }]
});