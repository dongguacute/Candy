import React, { useState, useRef } from 'react';
import { useAppContext, TimeToTake } from '../context/AppContext';
import { MdAdd, MdClose, MdImage, MdEmojiEmotions, MdMedication, MdWarning } from 'react-icons/md';

export default function Home() {
  const { medications, addMedication, removeMedication } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [medToDelete, setMedToDelete] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [times, setTimes] = useState<TimeToTake[]>([]);
  const [iconType, setIconType] = useState<'emoji' | 'image'>('emoji');
  const [iconValue, setIconValue] = useState('💊');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timeOptions: { value: TimeToTake; label: string }[] = [
    { value: 'breakfast', label: '早餐' },
    { value: 'lunch', label: '午餐' },
    { value: 'dinner', label: '晚餐' },
    { value: 'bedtime', label: '睡前' },
  ];

  const handleTimeToggle = (time: TimeToTake) => {
    if (times.includes(time)) {
      setTimes(times.filter(t => t !== time));
    } else {
      setTimes([...times, time]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconType('image');
        setIconValue(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入药物名称');
      return;
    }
    if (times.length === 0) {
      alert('请选择服用时间');
      return;
    }
    
    addMedication({
      name: name.trim(),
      times,
      iconType,
      iconValue,
    });
    
    setName('');
    setTimes([]);
    setIconType('emoji');
    setIconValue('💊');
    setIsAdding(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-yellow-900 dark:text-yellow-100 tracking-tight">我的药物</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#FDEB9B] hover:bg-[#FCD34D] text-yellow-900 font-bold rounded-full shadow-sm transition-all transform hover:scale-105 dark:bg-yellow-600 dark:text-yellow-50 dark:hover:bg-yellow-500"
        >
          <MdAdd className="text-xl" /> 添加药物
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-yellow-950/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-[#FFFDF0] dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border-4 border-[#FDEB9B] dark:border-gray-700">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">添加新药物</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-[#FEF5C8] hover:bg-[#FDEB9B] text-yellow-800 rounded-full transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                <MdClose className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3 ml-2">药物名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 rounded-full border-2 border-[#FDEB9B] dark:border-gray-600 bg-white dark:bg-gray-700 text-yellow-900 dark:text-gray-100 focus:ring-4 focus:ring-[#FDEB9B]/50 focus:border-[#FCD34D] outline-none transition-all placeholder-yellow-300 dark:placeholder-gray-400 font-medium"
                  placeholder="例如：阿莫西林"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3 ml-2">服用时间 (可多选)</label>
                <div className="flex flex-wrap gap-3">
                  {timeOptions.map(option => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleTimeToggle(option.value)}
                      className={`px-6 py-3 rounded-full text-sm font-bold transition-all transform active:scale-95 ${
                        times.includes(option.value)
                          ? 'bg-[#FCD34D] text-yellow-900 shadow-md ring-2 ring-[#FCD34D] ring-offset-2 ring-offset-[#FFFDF0] dark:ring-offset-gray-800 dark:bg-yellow-500 dark:text-yellow-950'
                          : 'bg-white dark:bg-gray-700 text-yellow-700 dark:text-gray-300 border-2 border-[#FDEB9B] dark:border-gray-600 hover:bg-[#FEF5C8] dark:hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3 ml-2">图标</label>
                <div className="flex items-center gap-6 bg-white dark:bg-gray-700 p-4 rounded-[2rem] border-2 border-[#FDEB9B] dark:border-gray-600">
                  <div className="w-20 h-20 rounded-full border-4 border-[#FDEB9B] dark:border-gray-600 flex items-center justify-center overflow-hidden bg-[#FFFDF0] dark:bg-gray-800 shadow-inner flex-shrink-0">
                    {iconType === 'emoji' ? (
                      <span className="text-4xl">{iconValue}</span>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={iconValue} alt="Icon" className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <MdEmojiEmotions className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 text-xl" />
                        <input
                          type="text"
                          value={iconType === 'emoji' ? iconValue : '💊'}
                          onChange={(e) => {
                            setIconType('emoji');
                            setIconValue(e.target.value || '💊');
                          }}
                          className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-[#FDEB9B] dark:border-gray-600 bg-[#FFFDF0] dark:bg-gray-800 focus:border-[#FCD34D] outline-none transition-colors text-center text-lg"
                          maxLength={2}
                          placeholder="💊"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-[#FEF5C8] dark:bg-gray-600 hover:bg-[#FDEB9B] dark:hover:bg-gray-500 text-yellow-800 dark:text-gray-200 rounded-full transition-colors"
                      >
                        <MdImage className="text-lg" /> 上传图片
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-4 rounded-full font-bold text-yellow-700 dark:text-gray-300 hover:bg-[#FEF5C8] dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-8 py-4 bg-[#FCD34D] hover:bg-[#FBBF24] text-yellow-900 font-bold rounded-full shadow-md transition-all transform hover:scale-105 dark:bg-yellow-500 dark:text-yellow-950"
                >
                  保存药物
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {medications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-yellow-700/50 dark:text-gray-500">
          <MdMedication className="text-8xl mb-6 text-[#FDEB9B] dark:text-gray-700" />
          <p className="text-2xl font-bold mb-2 text-yellow-800/60 dark:text-gray-400">暂无药物数据</p>
          <p className="text-lg">点击右上角按钮添加您的第一种药物</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {medications.map((med) => (
            <div key={med.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl border-2 border-[#FDEB9B] dark:border-gray-700 flex flex-col transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-[#FFFDF0] dark:bg-gray-700 border-4 border-[#FDEB9B] dark:border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                    {med.iconType === 'emoji' ? (
                      <span className="text-3xl">{med.iconValue}</span>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={med.iconValue} alt={med.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-900 dark:text-gray-100 break-all">{med.name}</h3>
                </div>
                <button
                  onClick={() => setMedToDelete(med.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FEF5C8] hover:bg-red-100 text-yellow-600 hover:text-red-500 dark:bg-gray-700 dark:hover:bg-red-900/30 transition-colors"
                  title="删除"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>
              
              <div className="mt-auto pt-6 border-t-2 border-[#FDEB9B]/50 dark:border-gray-700">
                <p className="text-sm font-bold text-yellow-700 dark:text-gray-400 mb-3 ml-1">服用时间</p>
                <div className="flex flex-wrap gap-2">
                  {med.times.map(t => (
                    <span key={t} className="px-4 py-2 bg-[#FEF5C8] dark:bg-gray-700 text-yellow-800 dark:text-yellow-200 font-bold text-sm rounded-full border border-[#FDEB9B] dark:border-gray-600">
                      {timeOptions.find(opt => opt.value === t)?.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {medToDelete && (
        <div className="fixed inset-0 bg-yellow-950/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-[#FFFDF0] dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border-4 border-[#FDEB9B] dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdWarning className="text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">确认删除？</h2>
            <p className="text-yellow-800/70 dark:text-gray-400 mb-8 font-medium">
              删除后将无法恢复该药物记录。
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMedToDelete(null)}
                className="px-6 py-3 rounded-full font-bold text-yellow-700 dark:text-gray-300 hover:bg-[#FEF5C8] dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  removeMedication(medToDelete);
                  setMedToDelete(null);
                }}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow-md transition-all transform hover:scale-105"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
