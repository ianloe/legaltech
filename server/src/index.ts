import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/legaltech',
});

// Database Initialization (in real apps use migrations)
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS playbook (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      preferredLanguage TEXT,
      riskLevel TEXT
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT,
      lastModifiedBy TEXT,
      businessUnit TEXT,
      department TEXT,
      legalRep TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      action TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    );
  `);

  const playbookCheck = await pool.query('SELECT COUNT(*) FROM playbook');
  if (playbookCheck.rows[0].count === '0') {
    await pool.query(`
      INSERT INTO playbook (id, title, description, preferredLanguage, riskLevel) VALUES
      ('p1', 'Limitation of Liability', 'Standard cap at 12 months fees.', 'In no event shall either party''s total liability exceed the total amount paid or payable to Vendor in the 12 months preceding the claim.', 'Medium'),
      ('p2', 'Governing Law', 'Preferred jurisdiction is Singapore.', 'This Agreement shall be governed by and construed in accordance with the laws of the Republic of Singapore.', 'Low'),
      ('p3', 'Termination for Convenience', '30-day notice period.', 'Either party may terminate this Agreement for any reason upon thirty (30) days prior written notice to the other party.', 'Low'),
      ('p4', 'Data Protection', 'Standard GDPR/PDPA compliance language.', 'Vendor shall process Personal Data only for the purposes of providing the Services and in accordance with applicable Data Protection Laws.', 'High'),
      ('p5', 'Intellectual Property', 'Customer retains ownership of all deliverables.', 'All Deliverables and Intellectual Property Rights therein shall be owned exclusively by the Customer.', 'High'),
      ('p6', 'Confidentiality', 'Standard 3-year survival period.', 'The obligations of confidentiality shall survive for a period of three (3) years from the date of termination.', 'Medium')
    `);
  }
};

initDb().catch(console.error);

// Playbook Routes
app.get('/api/playbook', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM playbook');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Contract Routes
app.get('/api/contracts/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/contracts', async (req, res) => {
  const { id, title, content, status, lastModifiedBy, businessUnit, department, legalRep, category } = req.body;
  try {
    await pool.query(
      'INSERT INTO contracts (id, title, content, status, lastModifiedBy, businessUnit, department, legalRep, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO UPDATE SET content = $3, status = $4, lastModifiedBy = $5, businessUnit = $6, department = $7, legalRep = $8, category = $9',
      [id, title, content, status, lastModifiedBy, businessUnit, department, legalRep, category]
    );
    res.json({ message: 'Saved successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Audit Log Routes
app.get('/api/audit-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  const { id, userId, userName, action, details } = req.body;
  try {
    await pool.query(
      'INSERT INTO audit_logs (id, userId, userName, action, details) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, userName, action, details]
    );
    res.json({ message: 'Log added' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
