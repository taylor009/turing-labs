import { Request, Response } from 'express';

// Test controller for validation middleware
export const testBasicValidation = (req: Request, res: Response): void => {
  res.json({
    message: 'Basic validation passed',
    body: req.body,
    query: req.query,
    params: req.params,
  });
};

export const testComplexValidation = (req: Request, res: Response): void => {
  res.json({
    message: 'Complex validation passed',
    data: {
      body: req.body,
      query: req.query,
      params: req.params,
    },
    validatedAt: new Date().toISOString(),
  });
};

export const testBusinessRules = (req: Request, res: Response): void => {
  res.json({
    message: 'Business rules validation passed',
    data: req.body,
    user: req.user,
  });
};

export const testAsyncValidation = async (req: Request, res: Response): Promise<void> => {
  // Simulate some async business logic
  await new Promise(resolve => setTimeout(resolve, 100));
  
  res.json({
    message: 'Async validation passed',
    data: req.body,
    processedAt: new Date().toISOString(),
  });
};

export const testMultipleValidation = (req: Request, res: Response): void => {
  res.json({
    message: 'Multiple validation targets passed',
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      'x-test-header': req.headers['x-test-header'],
    },
  });
};

export const testFileValidation = (req: Request, res: Response): void => {
  res.json({
    message: 'File validation passed',
    file: req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    } : null,
    body: req.body,
  });
};