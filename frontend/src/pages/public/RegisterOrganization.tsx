import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Globe, Palette, Check, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const presets = [
  { name: 'Indigo Core', value: '#6366F1' },
  { name: 'Emerald Wave', value: '#10B981' },
  { name: 'Royal Violet', value: '#8B5CF6' },
  { name: 'Crimson Surge', value: '#EF4444' },
  { name: 'Amber Sunset', value: '#F59E0B' },
  { name: 'Cyan Chill', value: '#06B6D4' },
];

const schema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(3, 'Workspace slug must be at least 3 characters')
    .max(30, 'Workspace slug must be under 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  domain: z.string().optional().or(z.literal('')),
  logoUrl: z.string().url('Must be a valid image URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const [primaryColor, setPrimaryColor] = useState('#6366F1');
  const [customColor, setCustomColor] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      logoUrl: '',
    },
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');

  // Auto-generate slug from organization name
  useEffect(() => {
    if (nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 30);
      setValue('slug', generatedSlug);
    }
  }, [nameValue, setValue]);

  // Debounced check for slug availability
  useEffect(() => {
    if (!slugValue || slugValue.length < 3 || !/^[a-z0-9-]+$/.test(slugValue)) {
      setSlugAvailable(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const res = await axios.get(`${API_URL}/api/v1/organizations/slug/${slugValue}`);
        setSlugAvailable(res.data?.data?.available ?? false);
      } catch (err) {
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [slugValue]);

  const onSubmit = async (data: FormData) => {
    if (slugAvailable === false) {
      toast.error('This workspace slug is already taken');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        primaryColor: customColor || primaryColor,
      };

      const res = await axios.post(`${API_URL}/api/v1/organizations/register`, payload);
      if (res.data.success) {
        toast.success('Organization registered successfully! 🎉');
        // Redirect to Login page with tenant slug query param for easy testing
        navigate(`/login?org=${data.slug}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            Create Your Workspace
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Onboard your company onto InternFlow and customize your workspace branding.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Organization Name
            </label>
            <div className="relative">
              <input
                {...register('name')}
                type="text"
                placeholder="e.g. Acme Corporation"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
              />
            </div>
            {errors.name && (
              <span className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Workspace Slug */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Workspace URL Slug
            </label>
            <div className="relative flex items-center">
              <input
                {...register('slug')}
                type="text"
                placeholder="acme"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none transition-colors"
              />
              <div className="absolute right-3 flex items-center pointer-events-none">
                {isCheckingSlug ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : slugAvailable === true ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : slugAvailable === false ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : null}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
              <span>Your workspace URL: <strong className="text-indigo-400">{slugValue || 'slug'}.internflow.app</strong></span>
              {slugAvailable === true && <span className="text-emerald-400 font-medium">Available</span>}
              {slugAvailable === false && <span className="text-rose-500 font-medium">Already taken</span>}
            </div>
            {errors.slug && (
              <span className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.slug.message}
              </span>
            )}
          </div>

          {/* Custom Domain (Optional) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" /> Custom Domain <span className="text-[10px] text-slate-500 lowercase">(optional)</span>
            </label>
            <input
              {...register('domain')}
              type="text"
              placeholder="e.g. interns.acme.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
            />
            {errors.domain && (
              <span className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.domain.message}
              </span>
            )}
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Logo URL <span className="text-[10px] text-slate-500 lowercase">(optional)</span>
            </label>
            <input
              {...register('logoUrl')}
              type="text"
              placeholder="e.g. https://acme.com/logo.png"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
            />
            {errors.logoUrl && (
              <span className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.logoUrl.message}
              </span>
            )}
          </div>

          {/* Workspace Primary Color */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-slate-400" /> Workspace Theme Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setPrimaryColor(p.value);
                    setCustomColor('');
                  }}
                  className={`h-10 rounded-xl relative transition-transform hover:scale-105 active:scale-95 border ${primaryColor === p.value && !customColor ? 'border-white scale-105' : 'border-slate-800'}`}
                  style={{ backgroundColor: p.value }}
                  title={p.name}
                >
                  {primaryColor === p.value && !customColor && (
                    <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 mt-2 bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <input
                type="color"
                value={customColor || primaryColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer outline-none border-0"
              />
              <span className="text-xs text-slate-400">
                Custom Color Picker (Selected: <strong className="text-slate-200 uppercase">{customColor || primaryColor}</strong>)
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || slugAvailable === false || isCheckingSlug}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Workspace...
              </>
            ) : (
              <>
                Initialize Workspace
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
