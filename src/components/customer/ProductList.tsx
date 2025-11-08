import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShoppingBag } from 'lucide-react';
import { Product } from '../../types';

interface ProductListProps {
  products: Product[];
  onProductSelect?: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onProductSelect }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Available Products</h2>
          <p className="text-gray-600">Browse our latest products available for EMI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No products available at the moment
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.product_images?.[0] && (
                    <img 
                      src={product.product_images[0].image_url} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold">₹{product.price}</p>
                      {product.is_offer && product.offer_price && (
                        <p className="text-sm text-green-600">
                          Special offer: ₹{product.offer_price}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => onProductSelect?.(product)}
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Get on EMI
                    </Button>
                  </div>
                  {product.description && (
                    <p className="text-sm text-gray-600">{product.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};