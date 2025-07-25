const db = require('./src/config/database');

async function testConnection() {
  try {
    await db.authenticate();
    console.log('✅ Koneksi berhasil');
  } catch (error) {
    console.error('❌ Gagal konek ke database:', error);
  }
}

testConnection();
