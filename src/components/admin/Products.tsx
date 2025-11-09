import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Plus } from 'lucide-react';
import { Product } from '../../types';
import { uploadFile } from '../../lib/file-upload';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', offer_price: '', is_offer: false });
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select(`*, product_images(*)`).order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (files: File[]) => {
    setImages(files);
  };

  // Upload product images using shared Cloudinary helper.
  // The helper will attempt signed uploads (if VITE_CLOUDINARY_SIGN_URL is set),
  // then unsigned preset (VITE_CLOUDINARY_UPLOAD_PRESET), then api_key as a last resort.
  const uploadProductImages = async (productId: string) => {
    const uploaded: { image_url: string }[] = [];
    try {
      for (const file of images) {
        try {
          const url = await uploadFile(file);
          if (url) uploaded.push({ image_url: url });
        } catch (err) {
          console.error('Failed to upload product image:', err);
        }
      }
    } catch (err) {
      console.error('Error uploading product images to Cloudinary:', err);
    }
    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: product, error } = await supabase.from('products').insert([{ name: form.name, description: form.description, price: parseFloat(form.price || '0'), offer_price: parseFloat(form.offer_price || '0'), is_offer: !!form.is_offer }]).select().single();
      if (error) throw error;
      if (product && images.length > 0) {
        const uploaded = await uploadProductImages(product.id);
        if (uploaded.length > 0) {
          const { error: imgErr } = await supabase.from('product_images').insert(uploaded.map(u => ({ product_id: product.id, image_url: u.image_url })));
          if (imgErr) console.error('Error saving product images:', imgErr);
        }
      }
      setIsModalOpen(false);
      setForm({ name: '', description: '', price: '', offer_price: '', is_offer: false });
      setImages([]);
      fetchProducts();
    } catch (err) {
      console.error('Error creating product:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-gray-200 rounded"></div></CardContent></Card>
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12">No products found</div>
        ) : (
          products.map((p) => (
            <Card key={p.id} hover>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">₹{p.price}</p>
                {p.product_images && p.product_images.length > 0 && (
                  <div className="mt-3">
                    <img src={p.product_images[0].image_url} alt={p.name} className="w-full h-40 object-cover rounded" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label="Offer Price" type="number" value={form.offer_price} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Images</label>
            <input type="file" multiple className="mt-2" onChange={(e) => handleImageSelect(Array.from(e.target.files || []))} />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
