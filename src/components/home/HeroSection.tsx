'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Phone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';

// ─── Types ──────────────────────────────────────────────────────────

interface CarModelOption {
  id: string;
  name: string;
  make: string;
  slug: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

// ─── Type → Makes Mapping (like hyaparts.com) ──────────────────────

const TYPE_MAKES: Record<string, { label: string; makes: string[] }> = {
  JAPAN: {
    label: 'JAPAN',
    makes: ['Toyota', 'Honda', 'Suzuki', 'Daihatsu'],
  },
  PAKISTAN: {
    label: 'PAKISTAN',
    makes: ['Toyota', 'Honda', 'Suzuki', 'Hyundai', 'MG', 'KIA', 'CHANGAN'],
  },
};

const TYPES = Object.keys(TYPE_MAKES);

// ─── Make → Models Mapping ──────────────────────────────────────────

const MAKE_MODELS: Record<string, string[]> = {
  Suzuki: ['WagonR', 'Alto', 'Mehran', 'Cultus', 'Swift', 'Jimny'],
  Toyota: ['Corolla XLI', 'Corolla GLI', 'Yaris', 'Fortuner', 'Land Cruiser', 'Prado', 'Hilux', 'Passo', 'Vitz', 'Aqua'],
  Honda: ['City', 'Civic', 'BR-V', 'HR-V', 'CR-V', 'Accord'],
  Daihatsu: ['Coure', 'Mira', 'Move', 'Boon'],
  Hyundai: ['Tucson', 'Elantra', 'Sonata', 'Staria'],
  MG: ['HS', 'ZS', 'GT'],
  KIA: ['Sportage', 'Picanto', 'Stonic', 'Seltos'],
  CHANGAN: ['Alsvin', 'Oshan X7', 'Karvaan'],
};

const YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009', '2008', '2007', '2006', '2005'];

const dropdownArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%236b7280' stroke-width='1.5'/%3E%3C/svg%3E")`;

const selectBaseClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 appearance-none cursor-pointer';

const selectDisabledClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500/30 appearance-none cursor-pointer';

export default function HeroSection() {
  const { setView, setFilters, setShowChat } = useAppStore();

  // ── Local State ─────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [partNumber, setPartNumber] = useState('');

  // ── Fetched Data ────────────────────────────────────────────────
  const [carModels, setCarModels] = useState<CarModelOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // ── Fetch car models & categories from API ──────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const [modelsRes, catsRes] = await Promise.all([
          fetch('/api/car-models'),
          fetch('/api/categories'),
        ]);
        const modelsData = await modelsRes.json();
        const catsData = await catsRes.json();
        if (modelsData.carModels) setCarModels(modelsData.carModels);
        if (catsData.categories) setCategories(catsData.categories);
      } catch {
        // Silently fail — dropdowns will still show hardcoded names
      }
    }
    fetchData();
  }, []);

  // ── Available makes for selected type ──────────────────────────
  const availableMakes = selectedType && TYPE_MAKES[selectedType]
    ? TYPE_MAKES[selectedType].makes
    : [];

  // ── Available models for selected make ──────────────────────────
  const availableModels = selectedMake
    ? MAKE_MODELS[selectedMake] || []
    : [];

  // ── Reset cascading dropdowns ──────────────────────────────────
  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value);
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
  }, []);

  const handleMakeChange = useCallback((value: string) => {
    setSelectedMake(value);
    setSelectedModel('');
    setSelectedYear('');
  }, []);

  const handleModelChange = useCallback((value: string) => {
    setSelectedModel(value);
  }, []);

  // ── Handle vehicle search ──────────────────────────────────────
  const handleVehicleSearch = useCallback(() => {
    const searchParts: string[] = [];
    if (selectedMake) searchParts.push(selectedMake);
    if (selectedModel) searchParts.push(selectedModel);

    let carModelId = '';
    if (selectedModel && selectedMake && carModels.length > 0) {
      const match = carModels.find(
        (cm) => cm.make === selectedMake && cm.name === selectedModel
      );
      if (match) carModelId = match.id;
    }

    let categoryId = '';
    if (selectedCategory && categories.length > 0) {
      const match = categories.find((cat) => cat.name === selectedCategory);
      if (match) categoryId = match.id;
    }

    setFilters({
      ...(searchParts.length > 0 ? { search: searchParts.join(' ') } : {}),
      ...(carModelId ? { carModelId } : {}),
      ...(categoryId ? { categoryId } : {}),
    });
    setView('catalog');
  }, [selectedMake, selectedModel, selectedCategory, carModels, categories, setFilters, setView]);

  // ── Handle part number search ──────────────────────────────────
  const handlePartNumberSearch = useCallback(() => {
    if (!partNumber.trim()) return;
    setFilters({ search: partNumber.trim() });
    setView('catalog');
  }, [partNumber, setFilters, setView]);

  return (
    <section className="w-full">
      {/* ═══════════════════════════════════════════════════════════
          Section 1: Vehicle Selector Hero — Clean White Theme
          ═══════════════════════════════════════════════════════════ */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          {/* Heading */}
          <div className="mb-8 text-center sm:mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl" style={{ color: '#B91C1C' }}>
              Select Your Vehicle
            </h2>
            <p className="mt-2 text-base font-semibold tracking-widest text-gray-500 sm:text-lg">
              (EASY FOR END USERS)
            </p>
          </div>

          {/* Vehicle Selector Row — 5 dropdowns like hyaparts */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 lg:flex-row lg:justify-center lg:gap-3">
            {/* Type Dropdown */}
            <div className="w-full lg:w-44">
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className={selectBaseClass}
                style={{ backgroundImage: dropdownArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="">Type</option>
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Make Dropdown */}
            <div className="w-full lg:w-44">
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Make
              </label>
              <select
                value={selectedMake}
                onChange={(e) => handleMakeChange(e.target.value)}
                disabled={!selectedType}
                className={selectDisabledClass}
                style={{ backgroundImage: dropdownArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="">
                  {!selectedType ? 'Select Type First' : 'Make'}
                </option>
                {availableMakes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Dropdown */}
            <div className="w-full lg:w-44">
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!selectedMake}
                className={selectDisabledClass}
                style={{ backgroundImage: dropdownArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="">
                  {!selectedMake ? 'Select Make First' : 'Model'}
                </option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="w-full lg:w-44">
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!selectedModel}
                className={selectDisabledClass}
                style={{ backgroundImage: dropdownArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="">
                  {!selectedModel ? 'Select Model First' : 'Year'}
                </option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Type / Category Dropdown */}
            <div className="w-full lg:w-44">
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Product Type
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={selectBaseClass}
                style={{ backgroundImage: dropdownArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="">Product Type</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="w-full lg:w-auto lg:pt-5">
              <Button
                size="lg"
                className="h-11 w-full rounded-lg px-6 text-base font-bold text-white shadow-lg lg:w-auto"
                style={{ backgroundColor: '#B91C1C' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
                onClick={handleVehicleSearch}
              >
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </div>

          {/* My Garage Link (like hyaparts) */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setShowChat(true)}
            >
              My Garage
            </Button>
            <button
              onClick={() => setShowChat(true)}
              className="group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-red-700" style={{ color: '#B91C1C' }}
            >
              <Phone className="h-4 w-4 transition-transform group-hover:rotate-12" />
              <span>Contact Us for Help</span>
              <ChevronDown className="h-3 w-3 rotate-[-90deg] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Section 2: Part Number Search (Light Background)
          ═══════════════════════════════════════════════════════════ */}
      <div className="w-full border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {/* Heading */}
          <div className="mb-5 text-center sm:mb-6">
            <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
              <span style={{ color: '#DC2626' }}>Search by Part Number</span>{' '}
              <br className="sm:hidden" />
              <span className="text-gray-700 text-sm sm:text-base">
                &nbsp;(TO USE PART NUMBER SEARCH,{' '}
              </span>
              <span className="text-sm sm:text-base" style={{ color: '#DC2626' }}>
                REGISTRATION IS NECESSARY)
              </span>
            </h3>
          </div>

          {/* Search Input Row */}
          <div className="mx-auto flex max-w-2xl flex-col items-stretch gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search..."
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePartNumberSearch();
                }}
                className="h-12 rounded-lg border-gray-300 bg-white pl-4 pr-4 text-base shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/30"
              />
            </div>
            <Button
              size="lg"
              className="h-12 rounded-lg px-8 text-base font-bold text-white shadow-md"
              style={{ backgroundColor: '#DC2626' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
              onClick={handlePartNumberSearch}
              disabled={!partNumber.trim()}
            >
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
