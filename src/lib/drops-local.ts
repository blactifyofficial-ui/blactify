import fs from 'fs';
import path from 'path';

const DROPS_FILE = path.join(process.cwd(), 'src/lib/drops.json');

export interface Drop {
    id: string;
    name: string;
    publishDate: string;
    createdAt: string;
}

export function getDrops(): Drop[] {
    try {
        if (!fs.existsSync(DROPS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DROPS_FILE, 'utf8');
        const drops: Drop[] = JSON.parse(data);

        // Auto-delete drops older than 2 days after publish date
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        
        const filteredDrops = drops.filter(drop => {
            const publishDate = new Date(drop.publishDate);
            return publishDate > twoDaysAgo;
        });

        if (filteredDrops.length !== drops.length) {
            // Something was deleted, find deleted drop IDs to clean up mappings
            const currentIds = new Set(filteredDrops.map(d => d.id));
            const deletedIds = drops.filter(d => !currentIds.has(d.id)).map(d => d.id);
            
            saveDrops(filteredDrops);
            
            // Clean up mappings for deleted drops
            if (deletedIds.length > 0) {
                const mappings = getProductDropMappings();
                const updatedMappings = mappings.filter(m => !deletedIds.includes(m.dropId));
                if (updatedMappings.length !== mappings.length) {
                    saveProductDropMappings(updatedMappings);
                }
            }
            return filteredDrops;
        }

        return drops;
    } catch (error) {
        console.error('Error reading drops:', error);
        return [];
    }
}

/**
 * Checks if a drop is locked (publish date has passed)
 */
export function isDropLocked(publishDate: string): boolean {
    return new Date(publishDate) < new Date();
}

export function saveDrops(drops: Drop[]) {
    try {
        const dir = path.dirname(DROPS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DROPS_FILE, JSON.stringify(drops, null, 2));
    } catch (error) {
        console.error('Error saving drops:', error);
    }
}

export interface ProductDropMapping {
    productId: string;
    dropId: string;
}

const PRODUCT_DROPS_FILE = path.join(process.cwd(), 'src/lib/product-drops.json');

export function getProductDropMappings(): ProductDropMapping[] {
    try {
        if (!fs.existsSync(PRODUCT_DROPS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(PRODUCT_DROPS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading product-drops:', error);
        return [];
    }
}

export function saveProductDropMappings(mappings: ProductDropMapping[]) {
    try {
        const dir = path.dirname(PRODUCT_DROPS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(PRODUCT_DROPS_FILE, JSON.stringify(mappings, null, 2));
    } catch (error) {
        console.error('Error saving product-drops:', error);
    }
}

/**
 * Returns a set of product IDs that should be hidden because they belong to a drop
 * that hasn't published yet.
 */
export function getHiddenProductIds(): Set<string> {
    try {
        const drops = getDrops();
        const mappings = getProductDropMappings();
        const now = new Date();

        const unPublishedDropIds = new Set(
            drops
                .filter(drop => new Date(drop.publishDate) > now)
                .map(drop => drop.id)
        );

        const hiddenProductIds = new Set(
            mappings
                .filter(mapping => unPublishedDropIds.has(mapping.dropId))
                .map(mapping => mapping.productId)
        );

        return hiddenProductIds;
    } catch (error) {
        console.error('Error calculating hidden product IDs:', error);
        return new Set();
    }
}
