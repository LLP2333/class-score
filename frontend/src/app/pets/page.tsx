'use client';

import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useStudentStore, useAuthStore } from '@/store';
import { usePetStore } from '@/store/usePetStore';
import { PetDisplay, PetEvolutionPreview, PetStageIcon } from '@/components/features/PetDisplay';
import { toast } from 'sonner';
import { Egg, Sparkles, Plus, Trash2, Pencil, ImagePlus, X } from 'lucide-react';
import type { Student, PetSpecies, PetStage } from '@/types';

const ELEMENT_OPTIONS: { value: string; label: string; emoji: string; color: string }[] = [
  { value: 'fire', label: '火', emoji: '🔥', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'water', label: '水', emoji: '💧', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'grass', label: '草', emoji: '🌿', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'electric', label: '电', emoji: '⚡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'ice', label: '冰', emoji: '❄️', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'dragon', label: '龙', emoji: '🐲', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'custom', label: '自定义', emoji: '⭐', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

function getElementInfo(element: string) {
  return ELEMENT_OPTIONS.find((e) => e.value === element) || ELEMENT_OPTIONS[ELEMENT_OPTIONS.length - 1];
}

const ELEMENT_BG: Record<string, string> = {
  fire: 'from-orange-50 via-red-50 to-amber-50',
  water: 'from-blue-50 via-cyan-50 to-sky-50',
  grass: 'from-green-50 via-emerald-50 to-lime-50',
  electric: 'from-yellow-50 via-amber-50 to-orange-50',
  ice: 'from-sky-50 via-blue-50 to-indigo-50',
  dragon: 'from-purple-50 via-violet-50 to-fuchsia-50',
  custom: 'from-slate-50 via-gray-50 to-zinc-50',
};

const ELEMENT_ACCENT: Record<string, string> = {
  fire: 'from-orange-400 to-red-500',
  water: 'from-blue-400 to-cyan-500',
  grass: 'from-green-400 to-emerald-500',
  electric: 'from-yellow-400 to-amber-500',
  ice: 'from-sky-400 to-blue-500',
  dragon: 'from-purple-400 to-violet-500',
  custom: 'from-slate-400 to-gray-500',
};

interface EditorStage {
  level: number;
  name: string;
  emoji: string;
  image?: string;
  min_score: number;
  description: string;
}

function makeEmptyStage(level: number, minScore: number): EditorStage {
  return { level, name: `阶段${level}`, emoji: '❓', min_score: minScore, description: '' };
}

export default function PetsPage() {
  const { students } = useStudentStore();
  const isTeacher = useAuthStore((s) => s.role === 'teacher');
  const currentClassId = useAuthStore((s) => s.currentClassId);
  const {
    species,
    studentPets,
    assignPet,
    removePet,
    getStudentPet,
    getPetStage,
    getPetSpecies,
    addSpecies,
    updateSpecies,
    deleteSpecies,
  } = usePetStore();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [petDetailOpen, setPetDetailOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSpeciesId, setEditingSpeciesId] = useState<number | null>(null);
  const [editorName, setEditorName] = useState('');
  const [editorElement, setEditorElement] = useState('custom');
  const [editorStages, setEditorStages] = useState<EditorStage[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageStageIdx, setImageStageIdx] = useState<number>(0);

  const petStats = useMemo(() => {
    const withPets = studentPets.length;
    const maxLevel = students.reduce((max, s) => {
      const stage = getPetStage(s.id, s.total_score);
      return stage ? Math.max(max, stage.level) : max;
    }, 0);
    const eggCount = students.filter((s) => {
      const stage = getPetStage(s.id, s.total_score);
      return stage && stage.level === 0;
    }).length;
    return { withPets, maxLevel, eggCount };
  }, [students, studentPets, getPetStage]);

  const handleAssignPet = async (speciesId: number) => {
    if (!selectedStudent || !currentClassId) return;
    await assignPet(currentClassId, selectedStudent.id, speciesId);
    toast.success(`已为 ${selectedStudent.name} 分配宠物！`);
    setAssignModalOpen(false);
    setSelectedStudent(null);
  };

  const handleBatchAssign = async () => {
    if (!currentClassId) return;
    const unassigned = students.filter((s) => !getStudentPet(s.id));
    if (unassigned.length === 0) { toast.info('所有学生都已有宠物'); return; }
    if (species.length === 0) { toast.error('请先创建宠物种类'); return; }
    for (const student of unassigned) {
      const randomSpecies = species[Math.floor(Math.random() * species.length)];
      await assignPet(currentClassId, student.id, randomSpecies.id);
    }
    toast.success(`已为 ${unassigned.length} 名学生随机分配宠物！`);
  };

  const handleOpenDetail = (student: Student) => {
    const pet = getStudentPet(student.id);
    if (pet) {
      setDetailStudent(student);
      setNicknameInput(pet.nickname);
      setPetDetailOpen(true);
    } else if (isTeacher) {
      setSelectedStudent(student);
      setAssignModalOpen(true);
    }
  };

  const handleRemovePet = async () => {
    if (!detailStudent) return;
    if (confirm(`确定要移除 ${detailStudent.name} 的宠物吗？`)) {
      await removePet(detailStudent.id);
      toast.success('宠物已移除');
      setPetDetailOpen(false);
    }
  };

  const openNewSpeciesEditor = () => {
    setEditingSpeciesId(null);
    setEditorName('');
    setEditorElement('custom');
    setEditorStages([
      { level: 0, name: '蛋', emoji: '🥚', min_score: 0, description: '一颗神秘的蛋' },
      makeEmptyStage(1, 20),
      makeEmptyStage(2, 50),
    ]);
    setEditorOpen(true);
  };

  const openEditSpeciesEditor = (sp: PetSpecies) => {
    setEditingSpeciesId(sp.id);
    setEditorName(sp.name);
    setEditorElement(sp.element);
    setEditorStages(sp.stages.map((s) => ({ ...s })));
    setEditorOpen(true);
  };

  const handleAddStage = () => {
    const lastScore = editorStages.length > 0 ? editorStages[editorStages.length - 1].min_score : 0;
    setEditorStages([...editorStages, makeEmptyStage(editorStages.length, lastScore + 50)]);
  };

  const handleRemoveStage = (idx: number) => {
    if (editorStages.length <= 2) { toast.error('至少需要保留2个阶段'); return; }
    setEditorStages(editorStages.filter((_, i) => i !== idx));
  };

  const handleStageChange = (idx: number, field: keyof EditorStage, value: string | number) => {
    setEditorStages(editorStages.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    ));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('请选择图片文件'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('图片大小不能超过2MB'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      handleStageChange(imageStageIdx, 'image', dataUrl);
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleRemoveImage = (idx: number) => {
    setEditorStages(editorStages.map((s, i) =>
      i === idx ? { ...s, image: undefined } : s
    ));
  };

  const handleSaveSpecies = async () => {
    if (!editorName.trim()) { toast.error('请输入宠物名称'); return; }
    if (editorStages.length < 2) { toast.error('至少需要2个阶段'); return; }
    if (!currentClassId) return;

    for (let i = 0; i < editorStages.length; i++) {
      if (!editorStages[i].name.trim()) { toast.error(`阶段${i}的名称不能为空`); return; }
      if (!editorStages[i].emoji.trim() && !editorStages[i].image) { toast.error(`阶段${i}需要设置emoji或图片`); return; }
    }
    for (let i = 1; i < editorStages.length; i++) {
      if (editorStages[i].min_score <= editorStages[i - 1].min_score) {
        toast.error('每个阶段的分数必须大于前一阶段');
        return;
      }
    }

    const stagesPayload = editorStages.map((s, i) => ({
      ...s,
      level: i,
      id: 0,
      species_id: editingSpeciesId || 0,
    }));

    if (editingSpeciesId) {
      await updateSpecies(editingSpeciesId, { name: editorName.trim(), element: editorElement, stages: stagesPayload });
      toast.success('宠物已更新');
    } else {
      await addSpecies(currentClassId, {
        name: editorName.trim(),
        element: editorElement,
        stages: stagesPayload,
      });
      toast.success('宠物已创建');
    }
    setEditorOpen(false);
  };

  const handleDeleteSpecies = async (sp: PetSpecies) => {
    const assignedCount = studentPets.filter((p) => p.species_id === sp.id).length;
    const msg = assignedCount > 0
      ? `确定要删除「${sp.name}」吗？有 ${assignedCount} 名学生拥有此宠物，删除后将同时移除。`
      : `确定要删除「${sp.name}」吗？`;
    if (!confirm(msg)) return;
    await deleteSpecies(sp.id);
    toast.success('已删除');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🐾</span>
          宠物乐园
        </h2>
        {isTeacher && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openNewSpeciesEditor}>
              <Plus className="h-4 w-4 mr-1" />
              新建宠物
            </Button>
            <Button size="sm" onClick={handleBatchAssign}>
              <Egg className="h-4 w-4 mr-1" />
              一键分配
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="text-2xl">🥚</div><div><div className="text-2xl font-bold">{petStats.withPets}</div><div className="text-xs text-muted-foreground">拥有宠物</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="text-2xl">🐣</div><div><div className="text-2xl font-bold">{petStats.eggCount}</div><div className="text-xs text-muted-foreground">待孵化</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="text-2xl">⭐</div><div><div className="text-2xl font-bold">Lv.{petStats.maxLevel}</div><div className="text-xs text-muted-foreground">最高等级</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="text-2xl">📊</div><div><div className="text-2xl font-bold">{species.length}</div><div className="text-xs text-muted-foreground">宠物种类</div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              宠物图鉴
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {species.map((sp, spIdx) => {
              const elem = getElementInfo(sp.element);
              const bgClass = ELEMENT_BG[sp.element] || ELEMENT_BG.custom;
              const accentClass = ELEMENT_ACCENT[sp.element] || ELEMENT_ACCENT.custom;
              return (
                <div
                  key={sp.id}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border-2 transition-all duration-500',
                    'hover:shadow-xl hover:scale-[1.02] hover:border-primary/40',
                    'pet-card-entrance',
                  )}
                  style={{ animationDelay: `${spIdx * 100}ms` }}
                >
                  <div className={cn('absolute inset-0 bg-linear-to-br opacity-60', bgClass)} />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={cn('absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-xl pet-orb-float', `bg-linear-to-br ${accentClass}`)} />
                    <div className={cn('absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-15 blur-lg pet-orb-float-reverse', `bg-linear-to-br ${accentClass}`)} />
                  </div>

                  <div className="relative p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-linear-to-br shadow-sm text-white text-sm', accentClass)}>
                          {elem.emoji}
                        </div>
                        <div>
                          <span className="font-bold text-base">{sp.name}</span>
                          <div className="text-[10px] text-muted-foreground">{elem.label}系宠物</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={cn('text-xs font-medium', elem.color)}>
                          {sp.stages.length}阶进化
                        </Badge>
                        {isTeacher && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEditSpeciesEditor(sp)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDeleteSpecies(sp)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-center gap-1 py-3 min-h-[100px]">
                      {sp.stages.map((stage, idx) => {
                        const sizeIdx = Math.min(idx, 4);
                        const scaleClass = ['text-2xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'][sizeIdx];
                        const imgSize = ['w-7 h-7', 'w-7 h-7', 'w-9 h-9', 'w-11 h-11', 'w-14 h-14'][sizeIdx];
                        const delayMs = idx * 150;
                        return (
                          <div key={stage.level} className="flex items-end">
                            {idx > 0 && (
                              <div className="flex items-center mb-3 mx-0.5">
                                <div className={cn('pet-arrow-line h-[2px] w-3', `bg-linear-to-r ${accentClass}`)} style={{ animationDelay: `${delayMs - 75}ms` }} />
                                <span className="text-[8px] text-muted-foreground/60 pet-arrow-pulse" style={{ animationDelay: `${delayMs - 75}ms` }}>▸</span>
                              </div>
                            )}
                            <div className="flex flex-col items-center gap-1 pet-stage-pop" style={{ animationDelay: `${delayMs}ms` }}>
                              <div className={cn(
                                'relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                                idx === 0 && 'pet-egg-wobble',
                                idx > 0 && idx < Math.max(1, sp.stages.length - 2) && 'pet-bounce',
                                idx >= Math.max(1, sp.stages.length - 2) && idx > 0 && 'pet-float',
                              )}>
                                {idx >= Math.max(1, sp.stages.length - 2) && idx > 0 && (
                                  <div className={cn('absolute inset-0 rounded-full blur-md opacity-30 pet-glow', `bg-linear-to-br ${accentClass}`)} />
                                )}
                                {stage.image ? (
                                  <img src={stage.image} alt={stage.name} className={cn(imgSize, 'relative z-10 object-contain select-none drop-shadow-sm')} draggable={false} />
                                ) : (
                                  <span className={cn(scaleClass, 'relative z-10 select-none drop-shadow-sm')}>{stage.emoji}</span>
                                )}
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] font-semibold leading-tight">{stage.name}</div>
                                <div className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full mt-0.5', `bg-linear-to-r ${accentClass}`, 'text-white/90')}>
                                  {stage.min_score}分
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                      <div className="flex -space-x-1">
                        {sp.stages.slice(1).map((stage) => (
                          <PetStageIcon key={stage.level} stage={stage} className="text-xs" />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {sp.stages[0].description}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">学生宠物</CardTitle></CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">📚</div>
              <p>还没有学生，请先添加学生</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {students.map((student) => {
                const pet = getStudentPet(student.id);
                const stage = pet ? getPetStage(student.id, student.total_score) : null;
                const sp = pet ? getPetSpecies(pet.species_id) : null;
                return (
                  <div
                    key={student.id}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer',
                      'hover:shadow-md hover:border-primary/30 transition-all',
                      pet ? 'bg-card' : 'bg-muted/30 border-dashed',
                    )}
                    onClick={() => handleOpenDetail(student)}
                  >
                    {stage && sp ? (
                      <PetDisplay stage={stage} species={sp} size="md" animate />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                        <Egg className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="text-sm font-medium truncate w-full text-center">{student.name}</div>
                    {pet && <div className="text-xs text-muted-foreground">{pet.nickname}</div>}
                    <div className="text-xs text-primary font-semibold">{student.total_score}分</div>
                    {!pet && isTeacher && <Button variant="ghost" size="sm" className="text-xs h-7">分配宠物</Button>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>为 {selectedStudent?.name} 选择宠物</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 gap-3 p-1">
              {species.map((sp) => {
                const elem = getElementInfo(sp.element);
                const eggStage = sp.stages[0];
                if (!eggStage) return null;
                return (
                  <div
                    key={sp.id}
                    className="p-4 border rounded-xl cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col items-center gap-2"
                    onClick={() => handleAssignPet(sp.id)}
                  >
                    <PetDisplay stage={eggStage} species={sp} size="md" animate />
                    <div className="font-semibold text-sm">{sp.name}</div>
                    <Badge variant="outline" className={cn('text-xs', elem.color)}>
                      {elem.emoji} {elem.label}系
                    </Badge>
                    <div className="text-xs text-muted-foreground text-center">{eggStage.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={petDetailOpen} onOpenChange={setPetDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>宠物详情</DialogTitle></DialogHeader>
          {detailStudent && (() => {
            const pet = getStudentPet(detailStudent.id);
            const stage = pet ? getPetStage(detailStudent.id, detailStudent.total_score) : null;
            const sp = pet ? getPetSpecies(pet.species_id) : null;
            if (!pet || !stage || !sp) return null;
            const nextStage = sp.stages.find((s) => s.level === stage.level + 1);
            return (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <PetDisplay stage={stage} species={sp} size="lg" showInfo animate />
                  <div className="text-lg font-semibold">{pet.nickname}</div>
                  <div className="text-sm text-muted-foreground">主人：{detailStudent.name} · {detailStudent.total_score}分</div>
                </div>
                {nextStage && (
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">距离下次进化还需</div>
                    <div className="text-lg font-bold text-primary">{nextStage.min_score - detailStudent.total_score}分</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <PetStageIcon stage={nextStage} /> {nextStage.name}
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((detailStudent.total_score - stage.min_score) / (nextStage.min_score - stage.min_score)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {!nextStage && stage.level > 0 && (
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <div className="text-sm font-semibold text-primary">✨ 已达到最高进化形态！</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium mb-2">进化之路</div>
                  <PetEvolutionPreview species={sp} currentScore={detailStudent.total_score} />
                </div>
                {isTeacher && (
                  <div>
                    <Label>宠物昵称</Label>
                    <Input value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} placeholder="给宠物起个名字" />
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            {isTeacher && (
              <>
                <Button variant="destructive" size="sm" onClick={handleRemovePet}>移除宠物</Button>
                <Button onClick={async () => {
                  if (!detailStudent || !currentClassId) return;
                  const pet = getStudentPet(detailStudent.id);
                  if (!pet) return;
                  await assignPet(currentClassId, detailStudent.id, pet.species_id, nicknameInput.trim() || '我的宠物');
                  toast.success('昵称已更新');
                  setPetDetailOpen(false);
                }}>保存昵称</Button>
              </>
            )}
            {!isTeacher && <Button onClick={() => setPetDetailOpen(false)}>关闭</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isTeacher && (
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="sm:max-w-2xl grid-rows-[auto_1fr_auto]! max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingSpeciesId ? '编辑宠物' : '新建宠物'}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto -mx-6 px-6 min-h-0">
              <div className="space-y-5 pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>宠物名称</Label>
                    <Input value={editorName} onChange={(e) => setEditorName(e.target.value)} placeholder="例：炎龙" />
                  </div>
                  <div>
                    <Label>属性类型</Label>
                    <Select value={editorElement} onValueChange={setEditorElement}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ELEMENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.emoji} {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold">进化阶段（{editorStages.length}个）</Label>
                    <Button variant="outline" size="sm" onClick={handleAddStage}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      添加阶段
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {editorStages.map((stage, idx) => (
                      <div key={idx} className="p-3 border rounded-lg space-y-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">阶段 {idx}</span>
                          {idx > 0 && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleRemoveStage(idx)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-[1fr_80px_1fr] gap-2">
                          <div>
                            <Label className="text-xs">名称</Label>
                            <Input value={stage.name} onChange={(e) => handleStageChange(idx, 'name', e.target.value)} placeholder="阶段名称" className="h-8 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">分数</Label>
                            <Input type="number" value={stage.min_score} onChange={(e) => handleStageChange(idx, 'min_score', parseInt(e.target.value) || 0)} disabled={idx === 0} className="h-8 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">描述</Label>
                            <Input value={stage.description} onChange={(e) => handleStageChange(idx, 'description', e.target.value)} placeholder="可选描述" className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="text-xs">Emoji</Label>
                            <Input value={stage.emoji} onChange={(e) => handleStageChange(idx, 'emoji', e.target.value)} placeholder="🥚" className="h-8 text-sm w-20" />
                          </div>
                          <div className="flex items-end gap-2">
                            <div>
                              <Label className="text-xs">自定义图片</Label>
                              <div className="flex items-center gap-2 mt-1">
                                {stage.image ? (
                                  <div className="relative group/img">
                                    <img src={stage.image} alt="" className="w-10 h-10 object-contain rounded border" />
                                    <button
                                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px] opacity-0 group-hover/img:opacity-100 transition-opacity"
                                      onClick={() => handleRemoveImage(idx)}
                                    >×</button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline" size="sm" className="h-8 text-xs"
                                    onClick={() => { setImageStageIdx(idx); imageInputRef.current?.click(); }}
                                  >
                                    <ImagePlus className="h-3.5 w-3.5 mr-1" />
                                    上传
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border">
                              {stage.image ? (
                                <img src={stage.image} alt="" className="w-7 h-7 object-contain" />
                              ) : (
                                <span className="text-lg">{stage.emoji || '❓'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditorOpen(false)}>取消</Button>
              <Button onClick={handleSaveSpecies}>{editingSpeciesId ? '保存修改' : '创建宠物'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}
