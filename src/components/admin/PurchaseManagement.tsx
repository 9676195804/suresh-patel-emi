import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Customer, Purchase, EMISchedule } from '../../types';
import { calculateEMI, generateEMISchedule } from '../../lib/emi-calculator';
import { sendPurchaseWelcomeSMS } from '../../lib/sms-service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Plus, ShoppingCart, Calendar, Pencil, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Invoice } from './Invoice';
import { uploadFile } from '../../lib/file-upload';

export const PurchaseManagement: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [defaultInterestRate, setDefaultInterestRate] = useState(24);
  const [purchaseImages, setPurchaseImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [selectedPurchaseForInvoice, setSelectedPurchaseForInvoice] = useState<Purchase | null>(null);
  const [invoiceEmis, setInvoiceEmis] = useState<EMISchedule[]>([]);
  const [shopDetails, setShopDetails] = useState({ name: '', address: '', phone: '' });
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testProgress, setTestProgress] = useState<number | null>(null);

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Cloudinary upload is handled by shared helper `src/lib/cloudinary.ts` which
  // will call a signing endpoint if VITE_CLOUDINARY_SIGN_URL is set, then fall
  // back to unsigned preset or api_key as configured.

  const handleTestUpload = async () => {
    if (!testFile) return;
    setTestLoading(true);
    setTestError(null);
    setTestProgress(0);

    try {
      const url = await uploadFile(testFile, (progress) => {
        setTestProgress(progress);
      });
      setTestResponse({ url });
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setTestLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  });

  const [formData, setFormData] = useState({
    customer_id: '',
    product_name: '',
    imei1: '',
    imei2: '',
    total_price: '',
    down_payment: '',
    processing_fee: '',
    tds_amount: '',
    insurance_amount: '',
    documentation_charges: '',
    other_charges: '',
    tenure: 6,
    interest_rate: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  // Image selection helpers
  const handleImageSelect = (files: File[]) => {
      // Combine existing and new files
      const newFiles = [...purchaseImages, ...files];
      setPurchaseImages(newFiles);
    
      // Create previews for all files
      const allPreviews = [
        ...imagePreviews,
        ...files.map((file) => URL.createObjectURL(file))
      ];
      setImagePreviews(allPreviews);
      // No upload status tracking here - uploads are handled during submit
  };

  const removeSelectedImage = (index: number) => {
    const files = [...purchaseImages];
    const previews = [...imagePreviews];
    const removed = files[index];
    files.splice(index, 1);
    previews.splice(index, 1);
    setPurchaseImages(files);
    setImagePreviews(previews);
    // no-op for upload status
  };

  // Drag & drop add and reorder
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dtFiles = Array.from(e.dataTransfer.files || []);
    if (dtFiles.length) {
      handleImageSelect(dtFiles);
    }
  };

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Image uploads happen at submit time; don't block form submit for in-progress uploads
  const isAnyImageUploading = false;
  const handleThumbDragStart = (index: number) => setDragIndex(index);
  const handleThumbDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const nextFiles = [...purchaseImages];
    const nextPreviews = [...imagePreviews];
    const [movedFile] = nextFiles.splice(dragIndex, 1);
    const [movedPreview] = nextPreviews.splice(dragIndex, 1);
    nextFiles.splice(index, 0, movedFile);
    nextPreviews.splice(index, 0, movedPreview);
    setPurchaseImages(nextFiles);
    setImagePreviews(nextPreviews);
    setDragIndex(index);
  };
  const handleThumbDragEnd = () => setDragIndex(null);

  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    mobile: ''
  });

  useEffect(() => {
    fetchPurchases();
    fetchCustomers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'default_interest_rate')
        .maybeSingle();
      
      if (data) {
        setDefaultInterestRate(parseFloat(data.value));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchPurchases = async () => {
    try {
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (purchasesError) throw purchasesError;

  const purchasesList = purchasesData || [];

  // Fetch images for all purchases
  const purchaseIds = purchasesList.map(p => p.id);
      if (purchaseIds.length > 0) {
        const { data: images, error: imagesError } = await supabase
          .from('purchase_images')
          .select('purchase_id, image_url')
          .in('purchase_id', purchaseIds);

        if (imagesError) {
          console.error('Error fetching purchase images:', imagesError);
        } else {
          const imagesByPurchase = images.reduce((acc, img) => {
            if (!acc[img.purchase_id]) {
              acc[img.purchase_id] = [];
            }
            acc[img.purchase_id].push(img);
            return acc;
          }, {} as Record<string, { purchase_id: string; image_url: string }[]>);

          const purchasesWithImages = purchasesList.map(p => ({
            ...p,
            purchase_images: imagesByPurchase[p.id] || [],
          }));
          setPurchases(purchasesWithImages);
          return;
        }
      }
      
      setPurchases(purchasesList);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
  const totalPrice = parseFloat(formData.total_price);
  const downPayment = parseFloat(formData.down_payment) || 0;
  // Auto-calc fees: 2% of total price for processing, 2.5% for TDS
  const processingFee = Number((totalPrice * 0.02).toFixed(2));
  const tdsAmount = Number((totalPrice * 0.025).toFixed(2));
  const insuranceAmount = parseFloat(formData.insurance_amount) || 0;
  const documentationCharges = parseFloat(formData.documentation_charges) || 0;
  const otherCharges = Number((totalPrice * 0.02).toFixed(2));
      
      const totalCharges = processingFee + tdsAmount + insuranceAmount + documentationCharges + otherCharges;
      const loanAmount = totalPrice - downPayment + totalCharges;
      const interestRate = parseFloat(formData.interest_rate) || defaultInterestRate;
      const emiAmount = calculateEMI(loanAmount, interestRate, formData.tenure);

      // Insert purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          customer_id: formData.customer_id,
          product_name: formData.product_name,
          imei1: formData.imei1,
          imei2: formData.imei2,
          total_price: totalPrice,
          down_payment: downPayment,
          processing_fee: processingFee,
          tds_amount: tdsAmount,
          insurance_amount: insuranceAmount,
          documentation_charges: documentationCharges,
          other_charges: otherCharges,
          loan_amount: loanAmount,
          tenure: formData.tenure,
          interest_rate: interestRate,
          emi_amount: emiAmount,
          start_date: formData.start_date
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Upload purchase images
      const uploadedUrls: string[] = [];
      for (const image of purchaseImages) {
        try {
          const url = await uploadFile(image);
          uploadedUrls.push(url);
        } catch (err) {
          console.error('Error uploading image:', err);
        }
      }
      setUploadedImageUrls(uploadedUrls);

      // Insert image URLs into purchase_images table
      if (uploadedUrls.length > 0) {
        const imageRecords = uploadedUrls.map(url => ({
          purchase_id: purchase.id,
          image_url: url
        }));
        const { error: imageInsertError } = await supabase
          .from('purchase_images')
          .insert(imageRecords);

        if (imageInsertError) {
          console.error('Error inserting image URLs:', imageInsertError);
        } else {
          // Add the new purchase to the state with the images
          const newPurchase = {
            ...purchase,
            purchase_images: imageRecords,
            customer: customers.find(c => c.id === purchase.customer_id)
          };
          setPurchases([newPurchase, ...purchases]);
          await handlePrintInvoice(newPurchase as Purchase);
        }
      } else {
        // Add the new purchase to the state without images
        const newPurchase = {
          ...purchase,
          purchase_images: [],
          customer: customers.find(c => c.id === purchase.customer_id)
        };
        setPurchases([newPurchase, ...purchases]);
        await handlePrintInvoice(newPurchase as Purchase);
      }

      // Generate EMI schedule
      const emiSchedule = generateEMISchedule(
        purchase.id,
        loanAmount,
        emiAmount,
        interestRate,
        formData.tenure,
        formData.start_date
      );

      const { error: scheduleError } = await supabase
        .from('emi_schedule')
        .insert(emiSchedule);

      if (scheduleError) throw scheduleError;

      // Send welcome SMS to customer
      const customer = customers.find(c => c.id === formData.customer_id);
      if (customer) {
        const { data: shopData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'shop_name')
          .maybeSingle();
        
  const shopName = shopData?.value || 'SURESH PATEL EMI';
        const firstDueDate = new Date(formData.start_date);
        firstDueDate.setMonth(firstDueDate.getMonth() + 1);
        
        await sendPurchaseWelcomeSMS(
          customer.name,
          customer.mobile,
          customer.id,
          formData.product_name,
          totalPrice,
          emiAmount,
          formData.tenure,
          firstDueDate.toLocaleDateString(),
          shopName
        );
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomerData])
        .select()
        .single();

      if (error) throw error;

      setCustomers([...customers, data]);
      setFormData({ ...formData, customer_id: data.id });
      setIsAddCustomerModalOpen(false);
      setNewCustomerData({ name: '', mobile: '' });
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const handlePrintInvoice = async (purchase: Purchase) => {
    try {
      // Fetch EMI schedule
      const { data: emis, error: emiError } = await supabase
        .from('emi_schedule')
        .select('*')
        .eq('purchase_id', purchase.id)
        .order('due_date');

      if (emiError) throw emiError;

      // Fetch purchase images
      const { data: images, error: imagesError } = await supabase
        .from('purchase_images')
        .select('image_url')
        .eq('purchase_id', purchase.id);

      if (imagesError) throw imagesError;

      // Fetch shop details
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('key, value');

      if (settingsError) throw settingsError;

      const details = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as { [key: string]: string });

      setShopDetails({
  name: details.shop_name || 'SURESH PATEL EMI',
        address: details.shop_address || '',
        phone: details.shop_phone || ''
      });

      setSelectedPurchaseForInvoice(purchase);
      setInvoiceEmis(emis || []);
      const imageUrls = images?.map(img => img.image_url) || [];
      setUploadedImageUrls(imageUrls);
    } catch (error) {
      console.error('Error preparing invoice:', error);
    }
  };

// Trigger print when invoice data is ready and node is present
  useEffect(() => {
    if (selectedPurchaseForInvoice && invoiceRef.current) {
      handlePrint();
    }
  }, [selectedPurchaseForInvoice, invoiceEmis]);

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsEditModalOpen(true);
  };

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;

    setLoading(true);

    try {
      // 1. Recalculate EMI and loan details
  const totalPrice = editingPurchase.total_price || 0;
  const downPayment = editingPurchase.down_payment || 0;
  // Auto-calc fees on update as 2% of total price
  const processingFee = Number((totalPrice * 0.02).toFixed(2));
  const tdsAmount = Number((totalPrice * 0.02).toFixed(2));
  const insuranceAmount = editingPurchase.insurance_amount || 0;
  const documentationCharges = editingPurchase.documentation_charges || 0;
  const otherCharges = Number((totalPrice * 0.02).toFixed(2));

      const totalCharges = processingFee + tdsAmount + insuranceAmount + documentationCharges + otherCharges;
      const loanAmount = totalPrice - downPayment + totalCharges;
      const interestRate = editingPurchase.interest_rate || defaultInterestRate;
      const emiAmount = loanAmount > 0 ? calculateEMI(loanAmount, interestRate, editingPurchase.tenure) : 0;

      // 2. Update purchase details in Supabase
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update({
          product_name: editingPurchase.product_name,
          total_price: totalPrice,
          down_payment: downPayment,
          tenure: editingPurchase.tenure,
          interest_rate: interestRate,
          start_date: editingPurchase.start_date,
          status: editingPurchase.status,
          processing_fee: processingFee,
          tds_amount: tdsAmount,
          insurance_amount: insuranceAmount,
          documentation_charges: documentationCharges,
          other_charges: otherCharges,
          imei1: editingPurchase.imei1,
          imei2: editingPurchase.imei2,
        })
        .eq('id', editingPurchase.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. Delete old EMI schedule
      const { error: deleteError } = await supabase
        .from('emi_schedule')
        .delete()
        .eq('purchase_id', editingPurchase.id);

      if (deleteError) throw deleteError;

      // 4. Generate and insert new EMI schedule
      const newSchedule = generateEMISchedule(
        editingPurchase.id,
        loanAmount,
        emiAmount,
        interestRate,
        editingPurchase.tenure,
        editingPurchase.start_date
      );

      const { error: scheduleError } = await supabase
        .from('emi_schedule')
        .insert(newSchedule);

      if (scheduleError) throw scheduleError;

  console.log('Purchase updated successfully!');
      setIsEditModalOpen(false);
      fetchPurchases(); // Refresh the list

    } catch (error) {
      console.error('Error updating purchase:', error);
  console.error('Failed to update purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      product_name: '',
      imei1: '',
      imei2: '',
      total_price: '',
      down_payment: '',
      processing_fee: '',
      tds_amount: '',
      insurance_amount: '',
      documentation_charges: '',
      other_charges: '',
      tenure: 6,
      interest_rate: '',
      start_date: new Date().toISOString().split('T')[0]
    });
    setPurchaseImages([]);
  };

  const totalPrice = parseFloat(formData.total_price) || 0;
  const downPayment = parseFloat(formData.down_payment) || 0;
  // Auto-calc fees as 2% of total price
  const processingFee = Number((totalPrice * 0.02).toFixed(2));
  const tdsAmount = Number((totalPrice * 0.02).toFixed(2));
  const insuranceAmount = parseFloat(formData.insurance_amount) || 0;
  const documentationCharges = parseFloat(formData.documentation_charges) || 0;
  const otherCharges = Number((totalPrice * 0.02).toFixed(2));
  
  const totalCharges = processingFee + tdsAmount + insuranceAmount + documentationCharges + otherCharges;
  const loanAmount = totalPrice - downPayment + totalCharges;
  const interestRate = parseFloat(formData.interest_rate) || defaultInterestRate;
  const emiAmount = loanAmount > 0 ? calculateEMI(loanAmount, interestRate, formData.tenure) : 0;
  const totalInterest = (emiAmount * formData.tenure) - loanAmount;
  const finalPrice = totalPrice + totalCharges + totalInterest;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Manage customer purchases and EMI plans</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={() => setIsTestModalOpen(true)}>
            Test Upload
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Purchase
          </Button>
        </div>
      </div>

      {/* Purchase List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : purchases.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No purchases found</p>
          </div>
        ) : (
          purchases.map((purchase) => (
            <Card key={purchase.id} hover>
              <CardHeader>
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">{purchase.product_name}</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{purchase.customer?.name}</p>
                    <p className="text-sm text-gray-500">{purchase.customer?.mobile}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="font-semibold text-green-600">₹{purchase.total_price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">EMI Amount</p>
                      <p className="font-semibold text-blue-600">₹{purchase.emi_amount}</p>
                    </div>
                  </div>
                  
                  {purchase.purchase_images && purchase.purchase_images.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Images</p>
                      <div className="flex space-x-2 mt-2">
                        {purchase.purchase_images.map((image, index) => (
                          <img
                            key={index}
                            src={image.image_url}
                            alt={`Purchase image ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {purchase.tenure} months
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(purchase)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handlePrintInvoice(purchase)}>
                      <Printer className="w-4 h-4 mr-1" />
                      Invoice
                    </Button>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      purchase.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : purchase.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Purchase"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Customer *
            </label>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsAddCustomerModalOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Customer
            </Button>
          </div>
          
          <select
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.mobile}
              </option>
            ))}
          </select>
          
          <Input
            label="Product Name *"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="IMEI 1 (Optional)"
              value={formData.imei1}
              onChange={(e) => setFormData({ ...formData, imei1: e.target.value })}
            />
            <Input
              label="IMEI 2 (Optional)"
              value={formData.imei2}
              onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Total Price *"
              type="number"
              step="0.01"
              value={formData.total_price}
              onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
              required
            />
            <Input
              label="Down Payment"
              type="number"
              step="0.01"
              value={formData.down_payment}
              onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Purchase Images (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors hover:border-blue-400" onDragOver={handleDragOver} onDrop={handleDrop}>
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => handleImageSelect(Array.from(e.target.files || []))}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            {purchaseImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {purchaseImages.map((file, index) => {
                  const preview = imagePreviews[index];
                  return (
                    <div key={file.name} className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm group" draggable onDragStart={() => handleThumbDragStart(index)} onDragEnter={() => handleThumbDragEnter(index)} onDragEnd={handleThumbDragEnd}>
                      {preview && (
                        <img src={preview} alt={file.name} className="h-32 w-full object-cover" />
                      )}
                      <button type="button" onClick={() => removeSelectedImage(index)} className="absolute top-2 right-2 bg-white/80 text-gray-800 hover:bg-white rounded-full p-1 shadow">
                        ✕
                      </button>
                      <div className="px-2 py-2 text-xs text-gray-700 truncate">{file.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Additional Charges Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Additional Charges</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Processing Fee (2%)"
                type="text"
                value={formData.total_price ? (Number(formData.total_price) * 0.02).toFixed(2) : '0.00'}
                readOnly
                placeholder="0.00"
              />
              <Input
                label="TDS Amount (2%)"
                type="text"
                value={formData.total_price ? (Number(formData.total_price) * 0.02).toFixed(2) : '0.00'}
                readOnly
                placeholder="0.00"
              />
              <Input
                label="Insurance Amount"
                type="number"
                step="0.01"
                value={formData.insurance_amount}
                onChange={(e) => setFormData({ ...formData, insurance_amount: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="Documentation Charges"
                type="number"
                step="0.01"
                value={formData.documentation_charges}
                onChange={(e) => setFormData({ ...formData, documentation_charges: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <Input
              label="Other Charges (2%)"
              type="text"
              value={formData.total_price ? (Number(formData.total_price) * 0.02).toFixed(2) : '0.00'}
              readOnly
              placeholder="0.00"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenure *
              </label>
              <select
                value={formData.tenure}
                onChange={(e) => setFormData({ ...formData, tenure: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={18}>18 months</option>
                <option value={24}>24 months</option>
              </select>
            </div>
            <Input
              label={`Interest Rate (Default: ${defaultInterestRate}%)`}
              type="number"
              step="0.01"
              value={formData.interest_rate}
              onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
              placeholder={defaultInterestRate.toString()}
            />
            <Input
              label="Start Date *"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          
          {/* EMI Preview */}
          {loanAmount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">EMI Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Product Price</p>
                  <p className="font-semibold text-blue-900">₹{totalPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Down Payment</p>
                  <p className="font-semibold text-blue-900">₹{downPayment.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Total Charges</p>
                  <p className="font-semibold text-orange-600">₹{totalCharges.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Loan Amount</p>
                  <p className="font-semibold text-blue-900">₹{loanAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Total Interest</p>
                  <p className="font-semibold text-purple-600">₹{totalInterest.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-blue-200">
                <div>
                  <p className="text-blue-700">Interest Rate</p>
                  <p className="font-semibold text-blue-900">{interestRate}% p.a.</p>
                </div>
                <div>
                  <p className="text-blue-700">EMI Amount</p>
                  <p className="font-semibold text-blue-900">₹{emiAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-bold">Final Price</p>
                  <p className="font-bold text-green-600 text-lg">₹{finalPrice.toFixed(2)}</p>
                </div>
              </div>
              {totalCharges > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-600 mb-2">Charges Breakdown:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    {processingFee > 0 && <span>Processing: ₹{processingFee}</span>}
                    {tdsAmount > 0 && <span>TDS: ₹{tdsAmount}</span>}
                    {insuranceAmount > 0 && <span>Insurance: ₹{insuranceAmount}</span>}
                    {documentationCharges > 0 && <span>Documentation: ₹{documentationCharges}</span>}
                    {otherCharges > 0 && <span>Other: ₹{otherCharges}</span>}
                  </div>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-blue-200 bg-green-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Total EMI Payments</p>
                    <p className="font-semibold text-green-900">₹{(emiAmount * formData.tenure).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Customer Pays Total</p>
                    <p className="font-bold text-green-900 text-lg">₹{(downPayment + (emiAmount * formData.tenure)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading || isAnyImageUploading}>
              Create Purchase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Purchase Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Purchase"
        size="lg"
      >
        {editingPurchase && (
          <form onSubmit={handleUpdatePurchase} className="space-y-4">
            <Input
              label="Product Name *"
              value={editingPurchase.product_name}
              onChange={(e) => setEditingPurchase({ ...editingPurchase, product_name: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="IMEI 1 (Optional)"
                value={editingPurchase.imei1 || ''}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, imei1: e.target.value })}
              />
              <Input
                label="IMEI 2 (Optional)"
                value={editingPurchase.imei2 || ''}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, imei2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Total Price *"
                type="number"
                step="0.01"
                value={editingPurchase.total_price}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, total_price: parseFloat(e.target.value) })}
                required
              />
              <Input
                label="Down Payment"
                type="number"
                step="0.01"
                value={editingPurchase.down_payment}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, down_payment: parseFloat(e.target.value) })}
              />
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Additional Charges</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Processing Fee (2%)"
                  type="text"
                  value={editingPurchase.total_price ? (Number(editingPurchase.total_price) * 0.02).toFixed(2) : '0.00'}
                  readOnly
                />
                <Input
                  label="TDS Amount (2%)"
                  type="text"
                  value={editingPurchase.total_price ? (Number(editingPurchase.total_price) * 0.02).toFixed(2) : '0.00'}
                  readOnly
                />
                <Input
                  label="Insurance Amount"
                  type="number"
                  step="0.01"
                  value={editingPurchase.insurance_amount}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, insurance_amount: parseFloat(e.target.value) })}
                />
                <Input
                  label="Documentation Charges"
                  type="number"
                  step="0.01"
                  value={editingPurchase.documentation_charges}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, documentation_charges: parseFloat(e.target.value) })}
                />
              </div>
              <Input
                label="Other Charges (2%)"
                type="text"
                value={editingPurchase.total_price ? (Number(editingPurchase.total_price) * 0.02).toFixed(2) : '0.00'}
                readOnly
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenure *
                </label>
                <select
                  value={editingPurchase.tenure}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, tenure: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={18}>18 months</option>
                  <option value={24}>24 months</option>
                </select>
              </div>
              <Input
                label={`Interest Rate (Default: ${defaultInterestRate}%)`}
                type="number"
                step="0.01"
                value={editingPurchase.interest_rate}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, interest_rate: parseFloat(e.target.value) })}
                placeholder={defaultInterestRate.toString()}
              />
              <Input
                label="Start Date *"
                type="date"
                value={editingPurchase.start_date}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, start_date: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Purchase'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Offscreen Invoice for Printing */}
      <div style={{ position: 'absolute', left: -10000, top: 0 }} aria-hidden>
        <div ref={invoiceRef}>
          {selectedPurchaseForInvoice && (
            <Invoice
              purchase={selectedPurchaseForInvoice}
              emis={invoiceEmis}
              shopDetails={shopDetails}
              purchaseImages={uploadedImageUrls}
            />
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <Input
            label="Customer Name *"
            value={newCustomerData.name}
            onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
            required
          />
          <Input
            label="Mobile Number *"
            value={newCustomerData.mobile}
            onChange={(e) => setNewCustomerData({ ...newCustomerData, mobile: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Add Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Test Cloudinary Upload Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setTestResponse(null);
          setTestError(null);
          setTestFile(null);
        }}
        title="Test Cloudinary Upload"
      >
        <div className="space-y-4">
          <input type="file" accept="image/*" onChange={(e) => setTestFile(e.target.files ? e.target.files[0] : null)} />
          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={() => {
              setTestResponse(null);
              setTestError(null);
            }}>Clear</Button>
            <Button type="button" onClick={async () => {
              if (!testFile) return setTestError('No file selected');
              try {
                setTestLoading(true);
                setTestError(null);
                const url = await uploadFile(testFile, (p) => {
                  setTestProgress(p);
                });
                setTestResponse({ secure_url: url });
              } catch (err: any) {
                setTestError(String(err?.message || err));
              } finally {
                setTestLoading(false);
              }
            }} disabled={testLoading}>
              {testLoading ? 'Uploading...' : 'Upload Test File'}
            </Button>
          </div>

          {typeof testProgress === 'number' && (
            <div className="text-sm">Progress: {Math.round(testProgress)}%</div>
          )}

          {testResponse && (
            <div>
              <h4 className="font-medium">Response</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">{JSON.stringify(testResponse, null, 2)}</pre>
              {testResponse.secure_url && (
                <img src={testResponse.secure_url} alt="test" className="mt-2 w-40 h-40 object-cover rounded" />
              )}
            </div>
          )}

          {testError && (
            <div className="text-red-600">Error: {testError}</div>
          )}
        </div>
      </Modal>

    </div>
  );
};


