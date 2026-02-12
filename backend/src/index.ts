import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import slasRoutes from './routes/slas';
import escalationRulesRoutes from './routes/escalationRules';
import categoriesRoutes from './routes/categories';
import zonesRoutes from './routes/zones';
import branchesRoutes from './routes/branches';
import enterpriseRoutes from './routes/enterprise';
import ticketsRoutes from './routes/tickets';
import reportsRoutes from './routes/reports';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ticketing-tool-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/slas', slasRoutes);
app.use('/api/escalation-rules', escalationRulesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/reports', reportsRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Ticketing API running at http://localhost:${config.port}`);
});
