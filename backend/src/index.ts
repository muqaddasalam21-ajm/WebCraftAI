import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { aiRouter } from './routes/aiRoutes';
import { authRouter } from './routes/authRoutes';
import { userRouter } from './routes/userRoutes';
import { profileRouter } from './routes/profileRoutes';
import { productRouter } from './routes/productRoutes';
import { vendorRouter } from './routes/vendorRoutes';
import { orderRouter } from './routes/orderRoutes';
import { notificationRouter } from './routes/notificationRoutes';
import { templateRouter } from './routes/templateRoutes';
import servicePackageRouter from './routes/servicePackageRoutes';
import { projectRouter } from './routes/projectRoutes';
import { taskRouter } from './routes/taskRoutes';
import { milestoneRouter } from './routes/milestoneRoutes';
import { auditRouter } from './routes/auditRoutes';
import { aiWebsiteRouter } from './routes/aiWebsiteRoutes';
import { checkoutRouter } from './routes/checkoutRoutes';
import { eventRouter } from './routes/eventRoutes';
import { deploymentRouter } from './routes/deploymentRoutes';
import { reportRouter } from './routes/reportRoutes';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'WebCraftAI Backend API',
    version: '0.15.0 (Phase 15 Real Business Dashboard + Advanced Reports)',
    aiConfigured: Boolean(config.geminiApiKey || config.openaiApiKey),
    provider: config.geminiApiKey ? 'gemini' : config.openaiApiKey ? 'openai' : 'webcraft-engine',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/profile', profileRouter);
app.use('/api/products', productRouter);
app.use('/api/vendors', vendorRouter);
app.use('/api/ai', aiRouter);
app.use('/api/orders', orderRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/templates', templateRouter);
app.use('/api/service-packages', servicePackageRouter);
app.use('/api/projects', projectRouter);
app.use('/api/projects', deploymentRouter);    // Phase 14: /:id/deploy, /:id/deployments, /:id/domains
app.use('/api/deployments', deploymentRouter); // Phase 14: /deployment/:id, /deployment/:id/unpublish
app.use('/api/deploy', deploymentRouter);      // Phase 14: /config
app.use('/api/reports', reportRouter);         // Phase 15: /overview, /sales, /revenue, /projects, /deployments, /customers, /vendors, /export
app.use('/api/tasks', taskRouter);
app.use('/api/milestones', milestoneRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/ai-builder', aiWebsiteRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/events', eventRouter);

// Serve frontend static build in production (e.g. Render single web service)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 WebCraftAI Backend API running on http://localhost:${config.port}`);
  console.log(`🤖 AI Provider: ${config.geminiApiKey ? 'Google Gemini' : config.openaiApiKey ? 'OpenAI' : 'WebCraft Engine'}`);
  console.log(`📦 Real Products & Real Vendors Engine: Active (v0.4.0)`);
  console.log(`🛠️ Real Custom Website Orders & In-App Notifications: Active (v0.5.0)`);
  console.log(`🏪 Real Template Marketplace: Active (v0.6.0)`);
  console.log(`📋 Real Service Packages & Admin Management: Active (v0.7.0)`);
  console.log(`🏗️ Real Website Project Lifecycle & Task/Milestone Foundation: Active (v0.8.0)`);
  console.log(`🚀 Real Website Publishing + Launch System: Active (v0.14.0)`);
  console.log(`📊 Real Business Dashboard + Advanced Reports: Active (v0.15.0)`);
});
