import { Request, Response } from 'express';
import { TemplateManager } from '../services/template-manager';
import { EmailTemplate } from '../types/email.types';

// Preview a specific template with sample data
export const previewTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { template } = req.params;
    
    if (!Object.values(EmailTemplate).includes(template as EmailTemplate)) {
      res.status(400).json({ error: 'Invalid template type' });
      return;
    }

    const data = req.body.data || undefined;
    const context = req.body.context || undefined;

    const result = TemplateManager.generateTemplate(
      template as EmailTemplate,
      data,
      context
    );

    res.json({
      template,
      result,
      metadata: TemplateManager.getTemplateMetadata(template as EmailTemplate),
    });
  } catch (error: any) {
    console.error('Error previewing template:', error);
    res.status(500).json({
      error: 'Failed to generate template preview',
      details: error.message,
    });
  }
};

// Get all available templates with metadata
export const listTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = TemplateManager.getAvailableTemplates();
    
    const templatesWithMetadata = templates.map(template => ({
      id: template,
      metadata: TemplateManager.getTemplateMetadata(template),
      sampleData: TemplateManager.getSampleData(template),
    }));

    res.json({
      templates: templatesWithMetadata,
      total: templates.length,
    });
  } catch (error: any) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
};

// Preview all templates
export const previewAllTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const context = req.body.context || undefined;
    const previews = TemplateManager.generateAllPreviews(context);
    
    const results = previews.map(preview => {
      try {
        const result = TemplateManager.generateTemplate(
          preview.template,
          preview.sampleData,
          preview.context
        );
        
        return {
          template: preview.template,
          success: true,
          result,
          metadata: TemplateManager.getTemplateMetadata(preview.template),
        };
      } catch (error: any) {
        return {
          template: preview.template,
          success: false,
          error: error.message,
          metadata: TemplateManager.getTemplateMetadata(preview.template),
        };
      }
    });

    res.json({
      previews: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });
  } catch (error: any) {
    console.error('Error previewing all templates:', error);
    res.status(500).json({ error: 'Failed to preview templates' });
  }
};

// Test template functionality
export const testTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { template } = req.params;
    
    if (!Object.values(EmailTemplate).includes(template as EmailTemplate)) {
      res.status(400).json({ error: 'Invalid template type' });
      return;
    }

    const testResult = TemplateManager.testTemplate(template as EmailTemplate);
    
    res.json({
      template,
      test: testResult,
      metadata: TemplateManager.getTemplateMetadata(template as EmailTemplate),
    });
  } catch (error: any) {
    console.error('Error testing template:', error);
    res.status(500).json({ error: 'Failed to test template' });
  }
};

// Test all templates
export const testAllTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const testResults = TemplateManager.testAllTemplates();
    
    const summary = Object.entries(testResults).reduce(
      (acc, [template, result]) => {
        acc.results.push({
          template,
          ...result,
          metadata: TemplateManager.getTemplateMetadata(template as EmailTemplate),
        });
        
        if (result.success) {
          acc.successful++;
        } else {
          acc.failed++;
        }
        
        return acc;
      },
      { results: [] as any[], successful: 0, failed: 0 }
    );

    res.json({
      tests: summary.results,
      summary: {
        total: summary.results.length,
        successful: summary.successful,
        failed: summary.failed,
        allPassed: summary.failed === 0,
      },
    });
  } catch (error: any) {
    console.error('Error testing all templates:', error);
    res.status(500).json({ error: 'Failed to test templates' });
  }
};

// Validate template data
export const validateTemplateData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { template } = req.params;
    const { data } = req.body;
    
    if (!Object.values(EmailTemplate).includes(template as EmailTemplate)) {
      res.status(400).json({ error: 'Invalid template type' });
      return;
    }

    if (!data || typeof data !== 'object') {
      res.status(400).json({ error: 'Template data is required and must be an object' });
      return;
    }

    const validation = TemplateManager.validateTemplateData(
      template as EmailTemplate,
      data
    );

    res.json({
      template,
      validation,
      sampleData: TemplateManager.getSampleData(template as EmailTemplate),
      metadata: TemplateManager.getTemplateMetadata(template as EmailTemplate),
    });
  } catch (error: any) {
    console.error('Error validating template data:', error);
    res.status(500).json({ error: 'Failed to validate template data' });
  }
};