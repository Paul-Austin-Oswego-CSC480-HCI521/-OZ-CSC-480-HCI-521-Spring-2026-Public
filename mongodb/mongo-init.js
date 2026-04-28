db = db.getSiblingDB('admin');

db.createUser({
  user: 'appuser',
  pwd: 'secret123',
  roles: [
    { role: 'readWriteAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' }
  ]
});