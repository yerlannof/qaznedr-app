'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  MapPin, 
  Factory, 
  Calendar,
  Download,
  Share2,
  Plus,
  Minus,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { getMineralIcon } from '@/components/icons';

interface ComparisonState {
  deposits: KazakhstanDeposit[];
  isOpen: boolean;
}

interface DepositComparisonProps {
  className?: string;
}

// Comparison Context
const useComparison = () => {
  const [comparison, setComparison] = useState<ComparisonState>({
    deposits: [],
    isOpen: false
  });

  const addToComparison = (deposit: KazakhstanDeposit) => {
    setComparison(prev => {
      if (prev.deposits.length >= 3) {
        return prev; // Max 3 deposits
      }
      if (prev.deposits.find(d => d.id === deposit.id)) {
        return prev; // Already exists
      }
      return {
        ...prev,
        deposits: [...prev.deposits, deposit]
      };
    });
  };

  const removeFromComparison = (depositId: string) => {
    setComparison(prev => ({
      ...prev,
      deposits: prev.deposits.filter(d => d.id !== depositId)
    }));
  };

  const openComparison = () => {
    setComparison(prev => ({ ...prev, isOpen: true }));
  };

  const closeComparison = () => {
    setComparison(prev => ({ ...prev, isOpen: false }));
  };

  const clearComparison = () => {
    setComparison({ deposits: [], isOpen: false });
  };

  return {
    comparison,
    addToComparison,
    removeFromComparison,
    openComparison,
    closeComparison,
    clearComparison
  };
};

// Floating Comparison Badge
export function ComparisonBadge({ 
  count, 
  onClick,
  className = '' 
}: {
  count: number;
  onClick: () => void;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl z-50 ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center space-x-3 px-4 py-3">
        <Scale className="w-5 h-5" />
        <div className="text-sm">
          <div className="font-semibold">Сравнить ({count})</div>
          <div className="text-xs opacity-90">месторождений</div>
        </div>
      </div>
      
      {/* Notification dot */}
      <motion.div
        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {count}
      </motion.div>
    </motion.button>
  );
}

// Main Comparison Modal
export function ComparisonModal({
  deposits,
  isOpen,
  onClose,
  onRemove,
  className = ''
}: {
  deposits: KazakhstanDeposit[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
  className?: string;
}) {
  const formatPrice = (price: number | null) => {
    if (!price) return 'По запросу';
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getComparisonRows = () => {
    const rows = [
      {
        label: 'Название',
        getValue: (deposit: KazakhstanDeposit) => deposit.title,
        type: 'text' as const
      },
      {
        label: 'Цена',
        getValue: (deposit: KazakhstanDeposit) => formatPrice(deposit.price),
        type: 'price' as const,
        compare: true
      },
      {
        label: 'Площадь',
        getValue: (deposit: KazakhstanDeposit) => `${deposit.area.toLocaleString()} км²`,
        type: 'area' as const,
        compare: true
      },
      {
        label: 'Тип',
        getValue: (deposit: KazakhstanDeposit) => {
          const types = {
            'MINING_LICENSE': 'Лицензия на добычу',
            'EXPLORATION_LICENSE': 'Лицензия на разведку', 
            'MINERAL_OCCURRENCE': 'Рудопроявление'
          };
          return types[deposit.type] || deposit.type;
        },
        type: 'text' as const
      },
      {
        label: 'Полезное ископаемое',
        getValue: (deposit: KazakhstanDeposit) => deposit.mineral,
        type: 'mineral' as const
      },
      {
        label: 'Регион',
        getValue: (deposit: KazakhstanDeposit) => deposit.region,
        type: 'location' as const
      },
      {
        label: 'Город',
        getValue: (deposit: KazakhstanDeposit) => deposit.city,
        type: 'text' as const
      },
      {
        label: 'Просмотры',
        getValue: (deposit: KazakhstanDeposit) => deposit.views.toLocaleString(),
        type: 'number' as const,
        compare: true
      },
      {
        label: 'Статус',
        getValue: (deposit: KazakhstanDeposit) => deposit.verified ? 'Проверено' : 'На проверке',
        type: 'status' as const
      }
    ];
    
    return rows;
  };

  const getBestValue = (deposits: KazakhstanDeposit[], getValue: (d: KazakhstanDeposit) => any, type: string) => {
    if (type === 'price') {
      const prices = deposits.map(d => d.price).filter(p => p !== null) as number[];
      return prices.length > 0 ? Math.min(...prices) : null;
    }
    if (type === 'area') {
      const areas = deposits.map(d => d.area);
      return Math.max(...areas);
    }
    if (type === 'number') {
      const numbers = deposits.map(d => getValue(d)).map(v => parseInt(v.replace(/,/g, '')));
      return Math.max(...numbers);
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed inset-4 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Сравнение месторождений
                </h2>
                <p className="text-gray-600 mt-1">
                  Сравните до {deposits.length} месторождений по ключевым параметрам
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Экспорт PDF</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Поделиться</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {deposits.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Добавьте месторождения для сравнения</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Deposit Headers */}
                  <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${deposits.length}, 1fr)` }}>
                    <div /> {/* Empty cell for labels */}
                    {deposits.map((deposit) => (
                      <motion.div
                        key={deposit.id}
                        className="bg-white border rounded-xl p-4 relative"
                        whileHover={{ y: -2, shadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                      >
                        <button
                          onClick={() => onRemove(deposit.id)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        <div className="mb-3">
                          {(() => {
                            const Icon = getMineralIcon(deposit.mineral);
                            return <Icon className="w-8 h-8 text-blue-600" />;
                          })()}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                          {deposit.title}
                        </h3>
                        <p className="text-xs text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {deposit.city}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Comparison Table */}
                  <div className="space-y-1">
                    {getComparisonRows().map((row, index) => {
                      const bestValue = row.compare ? getBestValue(deposits, row.getValue, row.type) : null;
                      
                      return (
                        <motion.div
                          key={row.label}
                          className="grid gap-4 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ gridTemplateColumns: `200px repeat(${deposits.length}, 1fr)` }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="font-medium text-gray-700 text-sm flex items-center">
                            {row.label}
                          </div>
                          {deposits.map((deposit) => {
                            const value = row.getValue(deposit);
                            const isBest = row.compare && (
                              (row.type === 'price' && deposit.price === bestValue) ||
                              (row.type === 'area' && deposit.area === bestValue) ||
                              (row.type === 'number' && parseInt(value.replace(/,/g, '')) === bestValue)
                            );

                            return (
                              <div
                                key={deposit.id}
                                className={`text-sm p-2 rounded-md ${
                                  isBest 
                                    ? 'bg-green-100 text-green-800 font-semibold border border-green-200' 
                                    : 'text-gray-800'
                                }`}
                              >
                                {row.type === 'status' && (
                                  <div className="flex items-center space-x-1">
                                    {deposit.verified ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                                    )}
                                    <span>{value}</span>
                                  </div>
                                )}
                                {row.type === 'mineral' && (
                                  <div className="flex items-center space-x-2">
                                    {(() => {
                                      const Icon = getMineralIcon(deposit.mineral);
                                      return <Icon className="w-4 h-4 text-blue-600" />;
                                    })()}
                                    <span>{value}</span>
                                  </div>
                                )}
                                {!['status', 'mineral'].includes(row.type) && (
                                  <span>{value}</span>
                                )}
                                {isBest && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="inline-flex items-center ml-2"
                                  >
                                    <TrendingUp className="w-3 h-3 text-green-600" />
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex justify-center space-x-4">
                    {deposits.map((deposit) => (
                      <Link
                        key={deposit.id}
                        href={`/listings/${deposit.id}`}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Подробнее о {deposit.mineral.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Comparison Add Button (for cards)
export function AddToComparisonButton({
  deposit,
  isAdded,
  onAdd,
  onRemove,
  className = ''
}: {
  deposit: KazakhstanDeposit;
  isAdded: boolean;
  onAdd: (deposit: KazakhstanDeposit) => void;
  onRemove: (id: string) => void;
  className?: string;
}) {
  const handleClick = () => {
    if (isAdded) {
      onRemove(deposit.id);
    } else {
      onAdd(deposit);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
        isAdded
          ? 'bg-blue-100 border-blue-300 text-blue-700'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      } ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isAdded ? (
        <Minus className="w-4 h-4" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
    </motion.button>
  );
}

// Main Export
export default function DepositComparison({ className = '' }: DepositComparisonProps) {
  const {
    comparison,
    addToComparison,
    removeFromComparison,
    openComparison,
    closeComparison,
    clearComparison
  } = useComparison();

  return (
    <div className={className}>
      <ComparisonBadge 
        count={comparison.deposits.length}
        onClick={openComparison}
      />
      
      <ComparisonModal
        deposits={comparison.deposits}
        isOpen={comparison.isOpen}
        onClose={closeComparison}
        onRemove={removeFromComparison}
      />
    </div>
  );
}

export { useComparison };