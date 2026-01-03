import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Building,
  LayoutTemplate,
  Clock,
  DollarSign,
  FolderOpen,
  Save,
  ArrowRight,
  ShieldCheck,
  FileDigit,
  Home,
  AlertCircle,
  Search,
  Loader2,
  HardHat,
  Tractor,
  Database,
  Users,
  Hammer,
  Filter,
  Download,
  Trash2,
  MoreHorizontal
} from "lucide-react";

// --- Types ---

type ProjectType = 'Residential' | 'Commercial' | 'Industrial' | 'Civil' | 'Healthcare' | 'Education' | 'Other';
type DeliveryMethod = 'Design-Bid-Build' | 'Design-Build' | 'CM at Risk' | 'IPD' | 'Other';
type ContractType = 'Lump Sum' | 'GMP' | 'Cost Plus' | 'Unit Price' | 'T&M';

interface ProjectDraft {
  name: string;
  code: string;
  client: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: ProjectType;
  size: string;
  sizeUnit: 'SF' | 'm2';
  deliveryMethod: DeliveryMethod;
  contractType: ContractType;
  targetBudget: string;
  startDate: string;
  endDate: string;
  drawings: string[];
  specs: string[];
  description: string;
}

interface Project extends ProjectDraft {
  id: string;
  status: 'Draft' | 'Active' | 'Completed';
  createdAt: string;
}

interface CostItem {
  id: string;
  code: string;
  item: string;
  unit: string;
  material: number;
  labor: number;
  equipment: number;
  total: number;
}

interface Vendor {
  id: string;
  name: string;
  trade: string;
  rating: number;
  status: 'Preferred' | 'Active' | 'Review' | 'Inactive';
  location: string;
  contact: string;
}

interface AddressResult {
  address: string;
  city: string;
  state: string;
  zip: string;
}

// --- Default Data / Seeding ---

const DEFAULT_COSTS: CostItem[] = [
  { id: '1', code: "03-30-00", item: "Cast-in-Place Concrete", unit: "CY", material: 145.00, labor: 65.00, equipment: 12.00, total: 222.00 },
  { id: '2', code: "05-12-00", item: "Structural Steel Framing", unit: "Ton", material: 3200.00, labor: 1100.00, equipment: 400.00, total: 4700.00 },
  { id: '3', code: "06-10-00", item: "Rough Carpentry Framing", unit: "MBF", material: 850.00, labor: 620.00, equipment: 45.00, total: 1515.00 },
  { id: '4', code: "09-29-00", item: "Gypsum Board - 5/8 Type X", unit: "SF", material: 0.65, labor: 1.10, equipment: 0.05, total: 1.80 },
  { id: '5', code: "09-65-00", item: "Resilient Flooring", unit: "SF", material: 3.50, labor: 2.25, equipment: 0.00, total: 5.75 },
  { id: '6', code: "22-11-13", item: "Copper Piping 3/4 inch", unit: "LF", material: 8.40, labor: 12.50, equipment: 1.10, total: 22.00 },
  { id: '7', code: "26-05-19", item: "12/2 MC Cable", unit: "LF", material: 1.25, labor: 2.80, equipment: 0.15, total: 4.20 },
  { id: '8', code: "31-23-00", item: "Excavation - Common Earth", unit: "CY", material: 0.00, labor: 4.50, equipment: 8.50, total: 13.00 },
];

const initialDraft: ProjectDraft = {
  name: "",
  code: "",
  client: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  type: 'Commercial',
  size: "",
  sizeUnit: 'SF',
  deliveryMethod: 'Design-Bid-Build',
  contractType: 'Lump Sum',
  targetBudget: "",
  startDate: "",
  endDate: "",
  drawings: [],
  specs: [],
  description: ""
};

// --- Shared Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fadeIn p-4">
       <div className="bg-white rounded-sm w-full max-w-lg border-2 border-yellow-500 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b-2 border-zinc-100 bg-zinc-50 sticky top-0 bg-white z-10">
             <h3 className="font-black font-display text-xl uppercase tracking-tight text-zinc-900">{title}</h3>
             <button onClick={onClose} className="text-zinc-400 hover:text-black transition-colors"><X className="w-6 h-6" /></button>
          </div>
          <div className="p-6">
             {children}
          </div>
       </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder, type = "text", required = false, icon: Icon, className }: any) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-bold text-zinc-800 mb-1 uppercase tracking-wide text-xs font-display">
      {label} {required && <span className="text-yellow-600">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-zinc-400" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full rounded-sm border-zinc-300 border bg-white py-2.5 ${Icon ? 'pl-10' : 'pl-3'} pr-3 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm sm:leading-6 shadow-sm transition-all`}
        placeholder={placeholder}
      />
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false, icon: Icon }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-bold text-zinc-800 mb-1 uppercase tracking-wide text-xs font-display">
      {label} {required && <span className="text-yellow-600">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-zinc-400" />
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full rounded-sm border-zinc-300 border bg-white py-2.5 ${Icon ? 'pl-10' : 'pl-3'} pr-3 text-zinc-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm sm:leading-6 shadow-sm transition-all`}
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, rows = 3 }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-bold text-zinc-800 mb-1 uppercase tracking-wide text-xs font-display">
      {label}
    </label>
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-sm border-zinc-300 border bg-white py-2 px-3 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm sm:leading-6 shadow-sm transition-all"
      placeholder={placeholder}
    />
  </div>
);

const AddressAutocomplete = ({ 
  label, 
  value, 
  onChange, 
  onSelect,
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length > 3 && showSuggestions) {
        setLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&countrycodes=us`
          );
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error("Failed to fetch address suggestions", error);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, showSuggestions]);

  const handleSelect = (item: any) => {
    const addr = item.address;
    const result: AddressResult = {
      address: `${addr.house_number || ''} ${addr.road || ''}`.trim() || item.display_name.split(',')[0],
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      state: addr.state || '',
      zip: addr.postcode || ''
    };
    
    if (!result.address && item.display_name) {
       result.address = item.display_name.split(',')[0];
    }

    onSelect(result);
    setShowSuggestions(false);
  };

  return (
    <div className="mb-4" ref={wrapperRef}>
      <label className="block text-sm font-bold text-zinc-800 mb-1 uppercase tracking-wide text-xs font-display">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" /> : <MapPin className="h-5 w-5 text-zinc-400" />}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="block w-full rounded-sm border-zinc-300 border bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm sm:leading-6 shadow-sm transition-all"
          placeholder={placeholder || "Start typing address..."}
          autoComplete="off"
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white mt-1 rounded-sm shadow-xl border border-zinc-200 max-h-60 overflow-auto">
            {suggestions.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSelect(item)}
                className="px-4 py-2 hover:bg-yellow-50 cursor-pointer text-sm text-zinc-700 border-b border-zinc-100 last:border-none flex flex-col"
              >
                <span className="font-medium text-zinc-900">{item.display_name.split(',')[0]}</span>
                <span className="text-xs text-zinc-500 truncate">{item.display_name}</span>
              </li>
            ))}
            <li className="px-2 py-1 bg-zinc-50 text-[10px] text-zinc-400 text-right">
              Powered by OpenStreetMap
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

// --- Wizard Components ---

const StepIndicator = ({ currentStep, steps }: { currentStep: number, steps: string[] }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between relative">
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-zinc-300 -z-10 rounded-full"></div>
      <div 
        className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-yellow-500 -z-10 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      ></div>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        return (
          <div key={step} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-sm flex items-center justify-center border-2 transition-all duration-200 bg-white
                ${isCompleted ? 'border-yellow-500 bg-yellow-500 text-black' : 
                  isCurrent ? 'border-yellow-500 text-black ring-4 ring-yellow-100' : 'border-zinc-300 text-zinc-400'}
              `}
            >
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">{index + 1}</span>}
            </div>
            <span className={`mt-2 text-xs font-bold uppercase tracking-wide font-display ${isCurrent ? 'text-yellow-600' : 'text-zinc-500'}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

const ProjectWizard = ({ onCancel, onSave }: { onCancel: () => void, onSave: (project: ProjectDraft) => void }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProjectDraft>(initialDraft);

  useEffect(() => {
    const saved = localStorage.getItem('american_iron_draft');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('american_iron_draft', JSON.stringify(data));
  }, [data]);

  const updateField = (field: keyof ProjectDraft, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddressSelect = (result: AddressResult) => {
    setData(prev => ({
      ...prev,
      address: result.address,
      city: result.city,
      state: result.state,
      zip: result.zip
    }));
  };

  const steps = ["General Info", "Scope", "Strategy", "Schedule", "Docs", "Review"];

  const handleNext = () => { if (step < steps.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };
  const handleFinish = () => {
    localStorage.removeItem('american_iron_draft');
    onSave(data);
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Project Name" value={data.name} onChange={(v: string) => updateField('name', v)} placeholder="e.g. Skyline Tower Renovations" required icon={Briefcase} />
              <InputField label="Project Code/Number" value={data.code} onChange={(v: string) => updateField('code', v)} placeholder="e.g. 24-001" icon={FileDigit} />
            </div>
            <InputField label="Client / Owner" value={data.client} onChange={(v: string) => updateField('client', v)} placeholder="e.g. American Iron Development" icon={Building} />
            <div className="border-t border-zinc-200 my-4 pt-4">
              <h4 className="text-sm font-bold text-zinc-900 mb-3 flex items-center uppercase tracking-wide font-display">
                <MapPin className="w-4 h-4 mr-2 text-yellow-500" /> Project Location
              </h4>
              <AddressAutocomplete label="Street Address" value={data.address} onChange={(v) => updateField('address', v)} onSelect={handleAddressSelect} placeholder="Start typing to search address..." />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InputField label="City" value={data.city} onChange={(v: string) => updateField('city', v)} placeholder="Metropolis" />
                <InputField label="State / Province" value={data.state} onChange={(v: string) => updateField('state', v)} placeholder="NY" />
                <InputField label="Zip / Postal Code" value={data.zip} onChange={(v: string) => updateField('zip', v)} placeholder="10001" />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Project Type / Sector" value={data.type} onChange={(v: any) => updateField('type', v)} options={['Residential', 'Commercial', 'Industrial', 'Civil', 'Healthcare', 'Education', 'Other']} required icon={LayoutTemplate} />
              <div className="flex gap-2">
                <div className="flex-grow"><InputField label="Project Size" value={data.size} onChange={(v: string) => updateField('size', v)} placeholder="e.g. 5000" type="number" /></div>
                <div className="w-1/3"><SelectField label="Unit" value={data.sizeUnit} onChange={(v: any) => updateField('sizeUnit', v)} options={['SF', 'm2']} /></div>
              </div>
            </div>
            <TextAreaField label="Project Description / Scope Summary" value={data.description} onChange={(v: string) => updateField('description', v)} placeholder="Describe the scope of work..." rows={6} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-fadeIn">
             <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-sm flex items-start mb-4">
                <ShieldCheck className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-yellow-900 font-medium">Delivery Method and Contract Type determine estimate structure.</p>
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Delivery Method" value={data.deliveryMethod} onChange={(v: any) => updateField('deliveryMethod', v)} options={['Design-Bid-Build', 'Design-Build', 'CM at Risk', 'IPD', 'Other']} required />
              <SelectField label="Contract Type" value={data.contractType} onChange={(v: any) => updateField('contractType', v)} options={['Lump Sum', 'GMP', 'Cost Plus', 'Unit Price', 'T&M']} required />
            </div>
            <InputField label="Target Budget" value={data.targetBudget} onChange={(v: string) => updateField('targetBudget', v)} placeholder="e.g. 1,500,000" icon={DollarSign} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Target Start Date" value={data.startDate} onChange={(v: string) => updateField('startDate', v)} type="date" icon={Calendar} />
              <InputField label="Target Completion Date" value={data.endDate} onChange={(v: string) => updateField('endDate', v)} type="date" icon={Clock} />
            </div>
            {data.startDate && data.endDate && (
              <div className="bg-zinc-100 p-4 rounded-sm border border-zinc-200 mt-4"><div className="flex justify-between items-center"><span className="text-zinc-600 font-medium">Estimated Duration:</span><span className="text-zinc-900 font-bold text-lg font-display">{Math.max(0, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)))} Weeks</span></div></div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fadeIn">
             <div><div className="flex justify-between items-center mb-2"><label className="block text-sm font-bold text-zinc-800 uppercase tracking-wide font-display">Drawings List</label><span className="text-xs text-zinc-500">One per line</span></div><textarea className="block w-full rounded-sm border-zinc-300 border bg-white py-2 px-3 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm shadow-sm font-mono text-xs" rows={6} value={data.drawings.join('\n')} onChange={(e) => updateField('drawings', e.target.value.split('\n'))} placeholder="A-000 Cover Sheet&#10;A-101 Floor Plan" /></div>
             <div><div className="flex justify-between items-center mb-2"><label className="block text-sm font-bold text-zinc-800 uppercase tracking-wide font-display">Specifications / Clarifications</label><span className="text-xs text-zinc-500">One per line</span></div><textarea className="block w-full rounded-sm border-zinc-300 border bg-white py-2 px-3 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm shadow-sm font-mono text-xs" rows={6} value={data.specs.join('\n')} onChange={(e) => updateField('specs', e.target.value.split('\n'))} placeholder="03 30 00 - Cast-in-Place Concrete" /></div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-sm border-2 border-zinc-200">
               <h3 className="text-xl font-bold font-display text-zinc-900 mb-4 border-b-4 border-yellow-500 pb-2 uppercase tracking-tight">{data.name || "Untitled Project"}</h3>
               <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><span className="text-zinc-500 block mb-1 text-xs uppercase font-bold font-display">Project Code</span><span className="font-bold text-zinc-900">{data.code || "-"}</span></div>
                  <div><span className="text-zinc-500 block mb-1 text-xs uppercase font-bold font-display">Client</span><span className="font-bold text-zinc-900">{data.client || "-"}</span></div>
                  <div><span className="text-zinc-500 block mb-1 text-xs uppercase font-bold font-display">Location</span><span className="font-bold text-zinc-900">{data.city}, {data.state}</span></div>
                  <div><span className="text-zinc-500 block mb-1 text-xs uppercase font-bold font-display">Sector</span><span className="font-bold text-zinc-900">{data.type}</span></div>
                  <div><span className="text-zinc-500 block mb-1 text-xs uppercase font-bold font-display">Size</span><span className="font-bold text-zinc-900">{data.size} {data.sizeUnit}</span></div>
                  <div><span className="text-zinc-500 block mb-1 text-xs uppercase font-bold font-display">Contract</span><span className="font-bold text-zinc-900">{data.deliveryMethod} - {data.contractType}</span></div>
               </div>
               <div className="mt-6 pt-4 border-t border-zinc-200"><span className="text-zinc-500 block mb-2 text-xs uppercase font-bold font-display">Scope Summary</span><p className="text-zinc-800 text-sm whitespace-pre-wrap">{data.description || "No description provided."}</p></div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-4xl font-black font-display text-zinc-900 uppercase tracking-tighter">Project Setup</h1><p className="text-zinc-500 mt-1 font-medium">Initialize a new estimate workspace</p></div>
        <button onClick={onCancel} className="text-zinc-400 hover:text-black p-2 transition-colors"><X className="w-8 h-8" /></button>
      </div>
      <StepIndicator currentStep={step} steps={steps} />
      <div className="bg-white rounded-sm shadow-xl border border-zinc-200 overflow-hidden">
        <div className="p-8 min-h-[400px]">{renderStepContent()}</div>
        <div className="bg-zinc-50 px-8 py-4 border-t border-zinc-200 flex justify-between items-center">
          <button onClick={handleBack} disabled={step === 0} className={`flex items-center px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors font-display ${step === 0 ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 hover:text-black hover:bg-zinc-200'}`}><ChevronLeft className="w-4 h-4 mr-1" /> Back</button>
          {step === steps.length - 1 ? (
            <button onClick={handleFinish} className="flex items-center px-8 py-3 bg-yellow-500 text-black rounded-sm text-base font-black uppercase tracking-wide hover:bg-yellow-400 shadow-lg transition-all transform hover:scale-[1.02] border-b-4 border-yellow-600 font-display">Create Project <CheckCircle className="w-5 h-5 ml-2" /></button>
          ) : (
            <button onClick={handleNext} className="flex items-center px-8 py-3 bg-yellow-500 text-black rounded-sm text-base font-black uppercase tracking-wide hover:bg-yellow-400 shadow-lg transition-all transform hover:scale-[1.02] border-b-4 border-yellow-600 font-display">Next Step <ChevronRight className="w-5 h-5 ml-2" /></button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Cost Database Component ---

const CostDatabase = ({ costs, onAddCost, onDeleteCost }: { costs: CostItem[], onAddCost: (item: Omit<CostItem, 'id'>) => void, onDeleteCost: (id: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ code: "", item: "", unit: "EA", material: 0, labor: 0, equipment: 0 });

  const filteredCosts = costs.filter(c => 
    c.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.includes(searchTerm)
  );

  const handleSubmit = () => {
    if (!newItem.code || !newItem.item) return;
    onAddCost({
        ...newItem,
        total: Number(newItem.material) + Number(newItem.labor) + Number(newItem.equipment)
    });
    setNewItem({ code: "", item: "", unit: "EA", material: 0, labor: 0, equipment: 0 });
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-10">
        <div><h1 className="text-5xl font-black font-display text-zinc-900 uppercase tracking-tighter">Cost Database</h1><p className="text-zinc-500 font-bold mt-2">Manage material, labor, and equipment rates</p></div>
        <div className="flex gap-2">
            <button className="bg-white border-2 border-zinc-300 hover:bg-zinc-50 text-zinc-900 px-4 py-2 rounded-sm flex items-center shadow-sm font-bold uppercase tracking-wide text-xs font-display"><Download className="w-4 h-4 mr-2" /> Import CSV</button>
            <button onClick={() => setIsModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-sm flex items-center shadow-md font-black uppercase tracking-wide text-xs border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 font-display"><Plus className="w-4 h-4 mr-2" /> Add Item</button>
        </div>
      </div>

      <div className="bg-white rounded-sm border-2 border-zinc-200 shadow-lg overflow-hidden">
        <div className="p-4 border-b-2 border-zinc-200 bg-zinc-50 flex gap-4">
            <div className="relative flex-grow max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-zinc-400" /></div>
                <input type="text" className="block w-full rounded-sm border-zinc-300 border bg-white py-2 pl-10 pr-3 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm" placeholder="Search by code or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button className="bg-white border border-zinc-300 text-zinc-600 px-3 py-2 rounded-sm flex items-center hover:bg-zinc-100"><Filter className="w-4 h-4" /></button>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-900">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-black font-display text-yellow-500 uppercase tracking-wider">CSI Code</th>
                        <th className="px-6 py-4 text-left text-sm font-black font-display text-white uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-left text-sm font-black font-display text-zinc-400 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-4 text-right text-sm font-black font-display text-zinc-400 uppercase tracking-wider">Material</th>
                        <th className="px-6 py-4 text-right text-sm font-black font-display text-zinc-400 uppercase tracking-wider">Labor</th>
                        <th className="px-6 py-4 text-right text-sm font-black font-display text-zinc-400 uppercase tracking-wider">Equip</th>
                        <th className="px-6 py-4 text-right text-sm font-black font-display text-yellow-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-4 text-right text-sm font-black font-display text-zinc-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                    {filteredCosts.length === 0 ? (
                        <tr><td colSpan={8} className="px-6 py-8 text-center text-zinc-500 italic">No cost items found. Add items to build your database.</td></tr>
                    ) : filteredCosts.map((cost) => (
                        <tr key={cost.id} className="hover:bg-yellow-50 transition-colors cursor-pointer group">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-600 font-mono group-hover:text-black border-l-4 border-transparent group-hover:border-yellow-500">{cost.code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-900 uppercase">{cost.item}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 font-medium">{cost.unit}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-600 font-mono">${Number(cost.material).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-600 font-mono">${Number(cost.labor).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-600 font-mono">${Number(cost.equipment).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-zinc-900 font-mono text-base">${Number(cost.total).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={(e) => { e.stopPropagation(); onDeleteCost(cost.id); }} className="text-zinc-400 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="bg-zinc-100 px-6 py-3 border-t-2 border-zinc-200 text-xs text-zinc-500 font-bold uppercase tracking-wide flex justify-between">
            <span>Showing {filteredCosts.length} items</span>
            <span>All data saved to local storage</span>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Cost Item">
         <div className="grid grid-cols-2 gap-4">
             <InputField label="CSI Code" value={newItem.code} onChange={(v: string) => setNewItem({...newItem, code: v})} placeholder="00-00-00" required />
             <InputField label="Unit" value={newItem.unit} onChange={(v: string) => setNewItem({...newItem, unit: v})} placeholder="EA" />
         </div>
         <InputField label="Description" value={newItem.item} onChange={(v: string) => setNewItem({...newItem, item: v})} placeholder="Item Description" required />
         <div className="grid grid-cols-3 gap-4">
             <InputField label="Material ($)" value={newItem.material} onChange={(v: string) => setNewItem({...newItem, material: parseFloat(v) || 0})} type="number" />
             <InputField label="Labor ($)" value={newItem.labor} onChange={(v: string) => setNewItem({...newItem, labor: parseFloat(v) || 0})} type="number" />
             <InputField label="Equipment ($)" value={newItem.equipment} onChange={(v: string) => setNewItem({...newItem, equipment: parseFloat(v) || 0})} type="number" />
         </div>
         <div className="bg-zinc-100 p-3 rounded-sm text-right mb-6 border border-zinc-200">
             <span className="text-zinc-500 font-bold text-xs uppercase mr-2">Calculated Total:</span>
             <span className="text-xl font-black text-zinc-900">${(Number(newItem.material) + Number(newItem.labor) + Number(newItem.equipment)).toFixed(2)}</span>
         </div>
         <div className="flex justify-end gap-3">
             <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-600 font-bold uppercase hover:bg-zinc-100 rounded-sm">Cancel</button>
             <button onClick={handleSubmit} className="px-6 py-2 bg-yellow-500 text-black font-black uppercase rounded-sm border-b-4 border-yellow-600 hover:bg-yellow-400 active:border-b-0 active:translate-y-1 transition-all">Save Item</button>
         </div>
      </Modal>
    </div>
  );
};

// --- Vendor Manager Component ---

const VendorManager = ({ vendors, onAddVendor, onDeleteVendor }: { vendors: Vendor[], onAddVendor: (item: Omit<Vendor, 'id'>) => void, onDeleteVendor: (id: string) => void }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newVendor, setNewVendor] = useState({ name: "", trade: "", rating: 5.0, status: "Active", location: "", contact: "" });

    const handleSubmit = () => {
        if (!newVendor.name) return;
        onAddVendor(newVendor as any);
        setNewVendor({ name: "", trade: "", rating: 5.0, status: "Active", location: "", contact: "" });
        setIsModalOpen(false);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-10">
                <div><h1 className="text-5xl font-black font-display text-zinc-900 uppercase tracking-tighter">Vendor Directory</h1><p className="text-zinc-500 font-bold mt-2">Manage subcontractors and suppliers</p></div>
                <button onClick={() => setIsModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-sm flex items-center shadow-md font-black uppercase tracking-wide text-xs border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 font-display"><Plus className="w-4 h-4 mr-2" /> New Vendor</button>
            </div>

            {vendors.length === 0 ? (
                <div className="bg-zinc-50 rounded-sm border-2 border-dashed border-zinc-300 p-16 text-center shadow-sm">
                    <div className="mx-auto w-20 h-20 bg-white text-zinc-400 rounded-full flex items-center justify-center mb-6 border-2 border-zinc-200"><HardHat className="w-10 h-10" /></div>
                    <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-wide">No Vendors Found</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto mb-8 font-medium">Add subcontractors and suppliers to your directory.</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-yellow-600 font-black hover:text-black flex items-center justify-center mx-auto uppercase tracking-wide text-sm border-b-2 border-transparent hover:border-yellow-500 transition-all font-display">Add First Vendor <ArrowRight className="w-4 h-4 ml-1" /></button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendors.map((vendor) => (
                        <div key={vendor.id} className="bg-white rounded-sm border-2 border-zinc-200 shadow-sm hover:shadow-xl transition-shadow p-6 group hover:border-yellow-400 relative">
                            <button onClick={() => onDeleteVendor(vendor.id)} className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            <div className="flex justify-between items-start mb-4 pr-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-black text-yellow-500 flex items-center justify-center rounded-sm mr-4 border-2 border-transparent group-hover:border-yellow-500 transition-colors"><HardHat className="w-6 h-6" /></div>
                                    <div><h3 className="font-black text-zinc-900 uppercase text-lg font-display leading-none mb-1">{vendor.name}</h3><span className="text-xs font-bold text-zinc-500 font-mono">{vendor.trade}</span></div>
                                </div>
                            </div>
                            <div className="space-y-3 mb-6 text-sm pl-16">
                                <div className="flex items-center text-zinc-700 font-medium"><MapPin className="w-4 h-4 mr-2 text-yellow-500" /> {vendor.location}</div>
                                <div className="flex items-center text-zinc-700 font-medium"><Users className="w-4 h-4 mr-2 text-yellow-500" /> {vendor.contact}</div>
                                <div className="flex items-center text-zinc-700 font-medium"><ShieldCheck className="w-4 h-4 mr-2 text-yellow-500" /> Rating: <span className="font-bold ml-1 text-black">{vendor.rating}/5.0</span></div>
                                <div className={`inline-block px-2 py-1 text-[10px] font-black uppercase tracking-wide rounded-sm border mt-1 ${vendor.status === 'Preferred' ? 'bg-green-100 text-green-900 border-green-300' : vendor.status === 'Review' ? 'bg-red-100 text-red-900 border-red-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300'}`}>{vendor.status}</div>
                            </div>
                            <div className="border-t-2 border-zinc-100 pt-4 flex gap-2">
                                <button className="flex-1 bg-white hover:bg-zinc-50 text-zinc-900 py-2 rounded-sm text-xs font-bold uppercase border-2 border-zinc-200 font-display transition-colors">View Profile</button>
                                <button className="flex-1 bg-black hover:bg-zinc-800 text-yellow-500 py-2 rounded-sm text-xs font-bold uppercase font-display border-2 border-black transition-colors">Send Invite</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Vendor">
                 <InputField label="Company Name" value={newVendor.name} onChange={(v: string) => setNewVendor({...newVendor, name: v})} placeholder="e.g. Ironclad Steel" required />
                 <div className="grid grid-cols-2 gap-4">
                     <InputField label="Trade" value={newVendor.trade} onChange={(v: string) => setNewVendor({...newVendor, trade: v})} placeholder="e.g. Concrete" required />
                     <SelectField label="Status" value={newVendor.status} onChange={(v: string) => setNewVendor({...newVendor, status: v})} options={['Active', 'Preferred', 'Review', 'Inactive']} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <InputField label="Location" value={newVendor.location} onChange={(v: string) => setNewVendor({...newVendor, location: v})} placeholder="City, State" />
                     <InputField label="Contact Person" value={newVendor.contact} onChange={(v: string) => setNewVendor({...newVendor, contact: v})} placeholder="Name" />
                 </div>
                 <div className="flex justify-end gap-3 mt-4">
                     <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-600 font-bold uppercase hover:bg-zinc-100 rounded-sm">Cancel</button>
                     <button onClick={handleSubmit} className="px-6 py-2 bg-yellow-500 text-black font-black uppercase rounded-sm border-b-4 border-yellow-600 hover:bg-yellow-400 active:border-b-0 active:translate-y-1 transition-all">Save Vendor</button>
                 </div>
            </Modal>
        </div>
    );
};

// --- Dashboard Component ---

const Dashboard = ({ projects, onNewProject, onDeleteProject }: { projects: Project[], onNewProject: () => void, onDeleteProject: (id: string) => void }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-10">
        <div><h1 className="text-5xl font-black font-display text-zinc-900 uppercase tracking-tighter">Projects</h1><p className="text-zinc-500 font-bold mt-2">Manage your active estimates</p></div>
        <button onClick={onNewProject} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-sm flex items-center shadow-lg font-black uppercase tracking-wide text-sm transition-all border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 font-display transform hover:scale-[1.02]"><Plus className="w-5 h-5 mr-2" /> New Estimate</button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-zinc-50 rounded-sm border-4 border-dashed border-zinc-300 p-16 text-center shadow-sm">
          <div className="mx-auto w-24 h-24 bg-white text-yellow-500 rounded-full flex items-center justify-center mb-6 border-4 border-zinc-200"><Briefcase className="w-12 h-12" /></div>
          <h3 className="text-2xl font-black font-display text-zinc-900 mb-2 uppercase tracking-wide">No projects yet</h3>
          <p className="text-zinc-500 max-w-sm mx-auto mb-8 font-medium">Get started by creating your first construction estimate using the project wizard.</p>
          <button onClick={onNewProject} className="text-black font-black hover:text-yellow-600 flex items-center justify-center mx-auto uppercase tracking-wide text-sm border-b-2 border-transparent hover:border-yellow-500 transition-all font-display">Start Wizard <ArrowRight className="w-4 h-4 ml-1" /></button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-sm border-2 border-zinc-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden group hover:-translate-y-1 duration-300 relative">
               <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 z-10 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
               <div className="p-6">
                  <div className="flex justify-between items-start mb-4 pr-6">
                    <div className="flex items-center space-x-4">
                       <div className="w-14 h-14 rounded-sm bg-black text-yellow-500 flex items-center justify-center border-2 border-transparent group-hover:border-yellow-500 transition-colors"><Building className="w-8 h-8" /></div>
                       <div><h3 className="font-black font-display text-zinc-900 group-hover:text-yellow-600 transition-colors uppercase tracking-tight text-xl leading-none mb-1">{project.name}</h3><span className="text-xs text-zinc-500 font-mono font-bold bg-zinc-100 px-1 py-0.5 rounded-sm">{project.code}</span></div>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 mb-6 font-medium pl-1">
                     <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-yellow-500" />{project.city}, {project.state}</div>
                     <div className="flex items-center"><LayoutTemplate className="w-4 h-4 mr-2 text-yellow-500" />{project.type} • {project.size} {project.sizeUnit}</div>
                     <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-yellow-500" />{project.startDate}</div>
                  </div>
                  <div className="border-t-2 border-zinc-100 pt-4 flex justify-between items-center text-sm">
                     <span className="text-zinc-500 font-bold text-xs uppercase font-display">Budget: <span className="text-zinc-900 font-black text-lg ml-1">${project.targetBudget}</span></span>
                     <button className="text-yellow-600 font-black hover:text-black uppercase text-xs tracking-wide flex items-center font-display">Open <ChevronRight className="w-3 h-3 ml-1" /></button>
                  </div>
               </div>
               <div className="h-2 bg-yellow-500 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- App Shell ---

const App = () => {
  const [view, setView] = useState<'dashboard' | 'wizard' | 'cost-db' | 'vendors'>('dashboard');
  
  // Persistent State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ai_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [costs, setCosts] = useState<CostItem[]>(() => {
    const saved = localStorage.getItem('ai_costs');
    // Initialize with Seed Data if empty
    if (!saved) {
        localStorage.setItem('ai_costs', JSON.stringify(DEFAULT_COSTS));
        return DEFAULT_COSTS;
    }
    return JSON.parse(saved);
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('ai_vendors');
    return saved ? JSON.parse(saved) : [];
  });

  // Effects to Save State
  useEffect(() => { localStorage.setItem('ai_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('ai_costs', JSON.stringify(costs)); }, [costs]);
  useEffect(() => { localStorage.setItem('ai_vendors', JSON.stringify(vendors)); }, [vendors]);

  // Handlers
  const handleSaveProject = (draft: ProjectDraft) => {
    const newProject: Project = { ...draft, id: Date.now().toString(), status: 'Draft', createdAt: new Date().toISOString() };
    setProjects([newProject, ...projects]);
    setView('dashboard');
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
        setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleAddCost = (item: Omit<CostItem, 'id'>) => {
      const newItem = { ...item, id: Date.now().toString() };
      setCosts([newItem, ...costs]);
  };

  const handleDeleteCost = (id: string) => {
      setCosts(costs.filter(c => c.id !== id));
  };

  const handleAddVendor = (item: Omit<Vendor, 'id'>) => {
      const newItem = { ...item, id: Date.now().toString() };
      setVendors([newItem, ...vendors]);
  };

  const handleDeleteVendor = (id: string) => {
      setVendors(vendors.filter(v => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900">
      <header className="bg-black border-b-8 border-yellow-500 sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-28">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-4 cursor-pointer group" onClick={() => setView('dashboard')}>
                 <div className="bg-white p-2 rounded-sm transform -rotate-1 shadow-lg border-2 border-yellow-500 hidden md:block group-hover:rotate-0 transition-transform duration-300">
                    <img src="./logo.png" alt="American Iron Logo" className="h-16 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                     <Tractor className="h-16 w-16 text-black hidden" onError={(e) => { const img = e.currentTarget.previousElementSibling as HTMLImageElement; if (img.style.display === 'none') e.currentTarget.classList.remove('hidden'); }} />
                 </div>
                 <div className="flex flex-col items-start leading-none select-none">
                    <div className="flex items-center"><span className="text-yellow-500 text-3xl md:text-4xl font-black tracking-tighter uppercase font-display transform scale-y-90 drop-shadow-md group-hover:text-white transition-colors">American</span></div>
                    <span className="text-white text-5xl md:text-6xl font-black tracking-tighter uppercase font-display -mt-2 transform scale-y-110 drop-shadow-lg group-hover:text-yellow-500 transition-colors">Iron</span>
                 </div>
              </div>
              <div className="hidden lg:ml-20 lg:flex lg:space-x-8 h-full items-end pb-1">
                <button onClick={(e) => { e.stopPropagation(); setView('dashboard'); }} className={`${(view === 'dashboard' || view === 'wizard') ? 'text-yellow-500 border-yellow-500' : 'text-zinc-500 border-transparent hover:text-white'} inline-flex items-center px-2 py-4 border-b-4 text-lg font-black uppercase tracking-wide transition-all font-display`}>Estimates</button>
                <button onClick={(e) => { e.stopPropagation(); setView('cost-db'); }} className={`${view === 'cost-db' ? 'text-yellow-500 border-yellow-500' : 'text-zinc-500 border-transparent hover:text-white'} inline-flex items-center px-2 py-4 border-b-4 text-lg font-black uppercase tracking-wide transition-all font-display`}>Cost Database</button>
                <button onClick={(e) => { e.stopPropagation(); setView('vendors'); }} className={`${view === 'vendors' ? 'text-yellow-500 border-yellow-500' : 'text-zinc-500 border-transparent hover:text-white'} inline-flex items-center px-2 py-4 border-b-4 text-lg font-black uppercase tracking-wide transition-all font-display`}>Vendors</button>
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-2 rounded-full text-zinc-400 hover:text-yellow-500 transition-colors mr-4"><span className="sr-only">Notifications</span><AlertCircle className="w-8 h-8" /></button>
              <div className="relative flex items-center bg-zinc-900 p-2 rounded-full pr-6 border border-zinc-800">
                <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-sm border-2 border-white">JD</div>
                <div className="ml-3 hidden md:block"><p className="text-sm font-bold text-white uppercase tracking-wide font-display">John Doe</p><p className="text-[10px] text-zinc-400 font-mono uppercase">Senior Estimator</p></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {view === 'dashboard' && <Dashboard projects={projects} onNewProject={() => setView('wizard')} onDeleteProject={handleDeleteProject} />}
        {view === 'wizard' && <ProjectWizard onCancel={() => setView('dashboard')} onSave={handleSaveProject} />}
        {view === 'cost-db' && <CostDatabase costs={costs} onAddCost={handleAddCost} onDeleteCost={handleDeleteCost} />}
        {view === 'vendors' && <VendorManager vendors={vendors} onAddVendor={handleAddVendor} onDeleteVendor={handleDeleteVendor} />}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);