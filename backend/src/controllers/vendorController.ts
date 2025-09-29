import { Request, Response } from 'express';
import { Vendor } from '../models/index.js';

export const getVendors = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching vendors from database...');
    const vendors = await Vendor.findAll();
    console.log(`Found ${vendors.length} vendors`);
    console.log('Vendors:', vendors.map(v => ({ id: v.id, name: v.name, timezone: v.timezone })));
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

export const getVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByPk(id);
    
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
};
