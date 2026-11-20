import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Upload,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { defaultProductImages, uploadProductImage } from '../../api/admin';

export default function ProductFormModal({ isOpen, onClose, onSave, editingProduct }) {
  const [formData, setFormData] = useState({
    name: '',
    scientific_name: '',
    category: 'Formulation',
    price: '',
    original_price: '',
    stock: 100,
    extract_type: '10 Tablets Strip',
    dosage: '1 tablet twice daily with meals or warm water.',
    short_desc: '',
    full_desc: '',
    ingredients: '',
    images: ['', '', '', ''],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingSlot, setUploadingSlot] = useState(null); // number 0..3 | 'batch' | null
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        scientific_name: editingProduct.scientific_name || '',
        category: editingProduct.category || 'Formulation',
        price: editingProduct.price !== undefined ? editingProduct.price : '',
        original_price: editingProduct.original_price || Math.round((editingProduct.price || 0) * 1.25),
        stock: editingProduct.stock !== undefined ? editingProduct.stock : 100,
        extract_type: editingProduct.extract_type || '10 Tablets Strip',
        dosage: editingProduct.dosage || '',
        short_desc: editingProduct.short_desc || '',
        full_desc: editingProduct.full_desc || '',
        ingredients: Array.isArray(editingProduct.ingredients)
          ? editingProduct.ingredients.join(', ')
          : editingProduct.ingredients || '',
        images: Array.isArray(editingProduct.images) && editingProduct.images.length === 4
          ? editingProduct.images
          : defaultProductImages,
      });
    } else {
      setFormData({
        name: '',
        scientific_name: '',
        category: 'Formulation',
        price: '',
        original_price: '',
        stock: 100,
        extract_type: '10 Tablets Strip',
        dosage: '1 tablet twice daily with meals or warm water.',
        short_desc: '',
        full_desc: '',
        ingredients: 'Standardized Botanical Extract, Active Alkaloids, Purified Excipients',
        images: [...defaultProductImages],
      });
    }
    setError(null);
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (index, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData((prev) => ({ ...prev, images: updatedImages }));
  };

  // Upload a single file from laptop into a specific slot
  const handleFileUploadForSlot = async (slotIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingSlot(slotIndex);
    setUploadProgressMsg(`Uploading ${file.name}...`);
    setError(null);

    try {
      const uploadedUrl = await uploadProductImage(file);
      handleImageChange(slotIndex, uploadedUrl);
    } catch (err) {
      setError(`Failed to upload ${file.name}: ${err.message}`);
    } finally {
      setUploadingSlot(null);
      setUploadProgressMsg('');
      event.target.value = '';
    }
  };

  // Upload up to 4 files from laptop at once (batch)
  const handleBatchUpload = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    if (files.length === 0) return;

    setUploadingSlot('batch');
    setUploadProgressMsg(`Uploading ${files.length} images from your laptop...`);
    setError(null);

    try {
      const newImages = [...formData.images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressMsg(`Processing image ${i + 1} of ${files.length} (${file.name})...`);
        const uploadedUrl = await uploadProductImage(file);
        newImages[i] = uploadedUrl;
      }
      setFormData((prev) => ({ ...prev, images: newImages }));
    } catch (err) {
      setError(`Batch upload error: ${err.message}`);
    } finally {
      setUploadingSlot(null);
      setUploadProgressMsg('');
      event.target.value = '';
    }
  };

  const handleFillDefaults = () => {
    setFormData((prev) => ({ ...prev, images: [...defaultProductImages] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError('Please provide a valid selling price in Rupees (₹).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        scientific_name: formData.scientific_name.trim() || `${formData.name.trim()} Pharmacopeia Compound`,
        category: formData.category.trim(),
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : Math.round(Number(formData.price) * 1.25),
        stock: parseInt(formData.stock, 10) || 100,
        extract_type: formData.extract_type.trim(),
        dosage: formData.dosage.trim(),
        short_desc: formData.short_desc.trim() || `Clinical grade ${formData.category.toLowerCase()} formulation.`,
        full_desc: formData.full_desc.trim() || `Laboratory certified therapeutic remedy formulated to pharmaceutical specifications.`,
        ingredients: formData.ingredients
          ? formData.ingredients.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Active Marker Compound'],
        images: formData.images.map((img, i) => (img && img.trim() ? img.trim() : defaultProductImages[i])),
      };

      await onSave(payload, editingProduct?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-[#d6e8dd] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#0a2e1e] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold">
              {editingProduct ? 'Edit Remedy / Formulation' : 'Add New Remedy to Supabase'}
            </h2>
            <p className="text-xs text-[#a3e6be]">
              {editingProduct ? `Updating record for ${editingProduct.name}` : 'Create a new pharmaceutical product with 4 high-res gallery images'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0a2e1e] mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Paracetamol 650mg / Black Seed Oil"
                className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a2e1e] mb-1">
                Scientific / Botanical Name
              </label>
              <input
                type="text"
                value={formData.scientific_name}
                onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                placeholder="e.g. Acetaminophen IP / Nigella sativa"
                className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>
          </div>

          {/* Category, Extract Type & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0a2e1e] mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none bg-white"
              >
                <option value="Formulation">Formulation</option>
                <option value="Tincture">Tincture</option>
                <option value="Capsules">Capsules</option>
                <option value="Topical Balm">Topical Balm</option>
                <option value="Syrup">Syrup / Elixir</option>
                <option value="Tablets">Tablets</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a2e1e] mb-1">Packaging / Unit</label>
              <input
                type="text"
                value={formData.extract_type}
                onChange={(e) => setFormData({ ...formData, extract_type: e.target.value })}
                placeholder="e.g. 15 Tablets Strip, 100ml Bottle"
                className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a2e1e] mb-1">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing & Discount */}
          <div className="p-4 bg-[#f0faf4] rounded-xl border border-[#d6e8dd] space-y-3">
            <h3 className="text-xs font-bold text-[#0a2e1e] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pricing & Automated Discount In Indian Rupees (₹)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0a2e1e] mb-1">
                  Selling Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="499.00"
                    className="w-full pl-7 pr-3 py-2 text-xs font-bold border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0a2e1e] mb-1">
                  Original MRP (₹) <span className="text-gray-400 font-normal">(for strikethrough & discount %)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="e.g. 625.00"
                    className="w-full pl-7 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {Number(formData.original_price) > Number(formData.price) && Number(formData.price) > 0 && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-100/60 p-2 rounded-md">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>
                  Displays {Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)}% OFF badge and saves ₹{(formData.original_price - formData.price).toFixed(2)} for patients!
                </span>
              </div>
            )}
          </div>

          {/* Descriptions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#0a2e1e] mb-1">Short Summary</label>
              <input
                type="text"
                value={formData.short_desc}
                onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
                placeholder="Brief one-line clinical indication"
                className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a2e1e] mb-1">Full Clinical Monograph / Description</label>
              <textarea
                rows="3"
                value={formData.full_desc}
                onChange={(e) => setFormData({ ...formData, full_desc: e.target.value })}
                placeholder="Detailed pharmacopeia description, extraction standards, and indications..."
                className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0a2e1e] mb-1">Dosage Guidance</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g. 1 tablet every 6 hours after meals"
                  className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0a2e1e] mb-1">Active Ingredients (comma-separated)</label>
                <input
                  type="text"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="e.g. Paracetamol 650mg, Caffeine 50mg"
                  className="w-full px-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Strictly 4 Product Gallery Images */}
          <div className="space-y-3 pt-3 border-t border-[#e2ece5]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-[#0a2e1e]">
                  Product Imagery (Strictly 4 Gallery Photos)
                </label>
                <p className="text-[11px] text-gray-500">
                  Upload photos directly from your laptop or paste web URLs
                </p>
              </div>

              <button
                type="button"
                onClick={handleFillDefaults}
                className="text-[11px] text-[#0a2e1e] hover:underline font-semibold bg-[#dcfce7] px-2.5 py-1 rounded"
              >
                Auto-Fill Clinical Images
              </button>
            </div>

            {/* Laptop Batch Upload Zone */}
            <div className="relative border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-[#f0faf4] hover:bg-[#e6f7ec] rounded-xl p-4 text-center transition-all cursor-pointer group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleBatchUpload}
                disabled={uploadingSlot !== null}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                title="Choose image files from laptop"
              />
              <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                <div className="p-2 bg-emerald-100 rounded-full text-emerald-800 group-hover:scale-105 transition-transform">
                  {uploadingSlot === 'batch' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                  ) : (
                    <Upload className="w-5 h-5 text-emerald-700" />
                  )}
                </div>
                <p className="text-xs font-bold text-[#0a2e1e]">
                  {uploadingSlot === 'batch' ? uploadProgressMsg : '📁 Click to Select Images from Your Laptop'}
                </p>
                <p className="text-[11px] text-[#4b6356]">
                  Select 1 to 4 files from your computer • Automatically uploads to Supabase Storage
                </p>
              </div>
            </div>

            {/* Individual 4 Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formData.images.map((imgUrl, idx) => {
                const isThisSlotUploading = uploadingSlot === idx;
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 bg-[#f8faf9] p-2.5 rounded-xl border border-[#e2ece5] hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Image Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center relative">
                        {isThisSlotUploading ? (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        ) : imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                            Photo #{idx + 1}
                          </span>

                          {/* Upload From Laptop Button */}
                          <label className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded transition-all active:scale-95">
                            {isThisSlotUploading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            <span>{isThisSlotUploading ? 'Uploading...' : 'Upload File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingSlot !== null}
                              onChange={(e) => handleFileUploadForSlot(idx, e)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* URL input / direct link preview */}
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={imgUrl}
                            onChange={(e) => handleImageChange(idx, e.target.value)}
                            placeholder="Image URL or upload from laptop"
                            className="w-full text-[11px] px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#0a2e1e] focus:outline-none bg-white font-mono"
                          />
                          {imgUrl && (
                            <button
                              type="button"
                              onClick={() => handleImageChange(idx, '')}
                              className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Clear image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-[#e2ece5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0a2e1e] hover:bg-[#072417] rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Saving to Supabase...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Changes' : 'Publish Product to Supabase'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
