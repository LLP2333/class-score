'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStudentStore } from '@/store';
import { usePetStore } from '@/store/usePetStore';
import { PetDisplay, PetEvolutionPreview } from '@/components/features/PetDisplay';
import { toast } from 'sonner';
import { Egg, Sparkles, Settings2 } from 'lucide-react';
import type { Student, PetSpecies } from '@/types';

const ELEMENT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  fire: { label: '火', emoji: '🔥', color: 'bg-red-100 text-red-700 border-red-200' },
  water: { label: '水', emoji: '💧', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  grass: { label: '草', emoji: '🌿', color: 'bg-green-100 text-green-700 border-green-200' },
  electric: { label: '电', emoji: '⚡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  ice: { label: '冰', emoji: '❄️', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  dragon: { label: '龙', emoji: '🐲', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export default function PetsPage() {
  const { students } = useStudentStore();
  const {
    config,
    species,
    studentPets,
    assignPet,
    removePet,
    updatePetNickname,
    getStudentPet,
    getPetStage,
    getPetSpecies,
    setConfig,
    updateAllThresholds,
  } = usePetStore();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [petDetailOpen, setPetDetailOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [thresholdInputs, setThresholdInputs] = useState<string[]>(
    config.evolutionThresholds.map(String)
  );

  const petStats = useMemo(() => {
    const total = students.length;
    const withPets = studentPets.length;
    const maxLevel = students.reduce((max, s) => {
      const stage = getPetStage(s.id, s.totalScore);
      return stage ? Math.max(max, stage.level) : max;
    }, 0);
    const eggCount = students.filter((s) => {
      const stage = getPetStage(s.id, s.totalScore);
      return stage && stage.level === 0;
    }).length;
    return { total, withPets, maxLevel, eggCount };
  }, [students, studentPets, getPetStage]);

  const handleAssignPet = (speciesId: string) => {
    if (!selectedStudent) return;
    assignPet(selectedStudent.id, speciesId);
    toast.success(`已为 ${selectedStudent.name} 分配宠物！`);
    setAssignModalOpen(false);
    setSelectedStudent(null);
  };

  const handleBatchAssign = () => {
    const unassigned = students.filter((s) => !getStudentPet(s.id));
    if (unassigned.length === 0) {
      toast.info('所有学生都已有宠物');
      return;
    }
    unassigned.forEach((student) => {
      const randomSpecies = species[Math.floor(Math.random() * species.length)];
      assignPet(student.id, randomSpecies.id);
    });
    toast.success(`已为 ${unassigned.length} 名学生随机分配宠物！`);
  };

  const handleOpenDetail = (student: Student) => {
    const pet = getStudentPet(student.id);
    if (pet) {
      setDetailStudent(student);
      setNicknameInput(pet.nickname);
      setPetDetailOpen(true);
    } else {
      setSelectedStudent(student);
      setAssignModalOpen(true);
    }
  };

  const handleSaveNickname = () => {
    if (!detailStudent) return;
    updatePetNickname(detailStudent.id, nicknameInput.trim() || '我的宠物');
    toast.success('昵称已更新');
    setPetDetailOpen(false);
  };

  const handleRemovePet = () => {
    if (!detailStudent) return;
    if (confirm(`确定要移除 ${detailStudent.name} 的宠物吗？`)) {
      removePet(detailStudent.id);
      toast.success('宠物已移除');
      setPetDetailOpen(false);
    }
  };

  const handleSaveSettings = () => {
    const parsed = thresholdInputs.map((v) => parseInt(v) || 0);
    for (let i = 1; i < parsed.length; i++) {
      if (parsed[i] <= parsed[i - 1]) {
        toast.error('每个进化阈值必须大于前一个阶段的阈值');
        return;
      }
    }
    updateAllThresholds(parsed);
    toast.success('进化阈值已更新');
    setSettingsOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🐾</span>
          宠物乐园
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            setThresholdInputs(config.evolutionThresholds.map(String));
            setSettingsOpen(true);
          }}>
            <Settings2 className="h-4 w-4 mr-1" />
            进化设置
          </Button>
          <Button size="sm" onClick={handleBatchAssign}>
            <Egg className="h-4 w-4 mr-1" />
            一键分配
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-2xl">🥚</div>
            <div>
              <div className="text-2xl font-bold">{petStats.withPets}</div>
              <div className="text-xs text-muted-foreground">拥有宠物</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-2xl">🐣</div>
            <div>
              <div className="text-2xl font-bold">{petStats.eggCount}</div>
              <div className="text-xs text-muted-foreground">待孵化</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-2xl">⭐</div>
            <div>
              <div className="text-2xl font-bold">Lv.{petStats.maxLevel}</div>
              <div className="text-xs text-muted-foreground">最高等级</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-2xl">📊</div>
            <div>
              <div className="text-2xl font-bold">{species.length}</div>
              <div className="text-xs text-muted-foreground">宠物种类</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pet species showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            宠物图鉴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {species.map((sp) => {
              const elem = ELEMENT_LABELS[sp.element];
              return (
                <div
                  key={sp.id}
                  className="p-4 border rounded-xl space-y-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{sp.name}</span>
                    <Badge variant="outline" className={cn('text-xs', elem?.color)}>
                      {elem?.emoji} {elem?.label}系
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2">
                    {sp.stages.map((stage) => (
                      <div key={stage.level} className="flex flex-col items-center">
                        <span className="text-2xl">{stage.emoji}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {stage.minScore}分
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Student pet list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">学生宠物</CardTitle>
        </CardHeader>
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
                const stage = pet ? getPetStage(student.id, student.totalScore) : null;
                const sp = pet ? getPetSpecies(pet.speciesId) : null;

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
                    <div className="text-sm font-medium truncate w-full text-center">
                      {student.name}
                    </div>
                    {pet && (
                      <div className="text-xs text-muted-foreground">{pet.nickname}</div>
                    )}
                    <div className="text-xs text-primary font-semibold">
                      {student.totalScore}分
                    </div>
                    {!pet && (
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        分配宠物
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign pet modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              为 {selectedStudent?.name} 选择宠物
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-2 gap-3 p-1">
              {species.map((sp) => {
                const elem = ELEMENT_LABELS[sp.element];
                const eggStage = sp.stages[0];
                return (
                  <div
                    key={sp.id}
                    className={cn(
                      'p-4 border rounded-xl cursor-pointer',
                      'hover:border-primary hover:shadow-md transition-all',
                      'flex flex-col items-center gap-2',
                    )}
                    onClick={() => handleAssignPet(sp.id)}
                  >
                    <PetDisplay stage={eggStage} species={sp} size="md" animate />
                    <div className="font-semibold text-sm">{sp.name}</div>
                    <Badge variant="outline" className={cn('text-xs', elem?.color)}>
                      {elem?.emoji} {elem?.label}系
                    </Badge>
                    <div className="text-xs text-muted-foreground text-center">
                      {eggStage.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Pet detail modal */}
      <Dialog open={petDetailOpen} onOpenChange={setPetDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>宠物详情</DialogTitle>
          </DialogHeader>
          {detailStudent && (() => {
            const pet = getStudentPet(detailStudent.id);
            const stage = pet ? getPetStage(detailStudent.id, detailStudent.totalScore) : null;
            const sp = pet ? getPetSpecies(pet.speciesId) : null;
            if (!pet || !stage || !sp) return null;

            const nextStage = sp.stages.find((s) => s.level === stage.level + 1);

            return (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <PetDisplay stage={stage} species={sp} size="lg" showInfo animate />
                  <div className="text-lg font-semibold">{pet.nickname}</div>
                  <div className="text-sm text-muted-foreground">
                    主人：{detailStudent.name} · {detailStudent.totalScore}分
                  </div>
                </div>

                {nextStage && (
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      距离下次进化还需
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {nextStage.minScore - detailStudent.totalScore}分
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {nextStage.name} {nextStage.emoji}
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((detailStudent.totalScore - stage.minScore) /
                              (nextStage.minScore - stage.minScore)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {!nextStage && stage.level > 0 && (
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <div className="text-sm font-semibold text-primary">
                      ✨ 已达到最高进化形态！
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium mb-2">进化之路</div>
                  <PetEvolutionPreview species={sp} currentScore={detailStudent.totalScore} />
                </div>

                <div>
                  <Label>宠物昵称</Label>
                  <Input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="给宠物起个名字"
                  />
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="destructive" size="sm" onClick={handleRemovePet}>
              移除宠物
            </Button>
            <Button onClick={handleSaveNickname}>保存昵称</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>进化阈值设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              设置每个进化阶段所需的最低积分。修改后将应用到所有宠物种类。
            </p>
            {['蛋（初始）', '第一形态', '第二形态', '第三形态', '最终形态'].map((label, i) => (
              <div key={i} className="flex items-center gap-3">
                <Label className="w-24 shrink-0 text-sm">{label}</Label>
                <Input
                  type="number"
                  value={thresholdInputs[i] || '0'}
                  onChange={(e) => {
                    const newInputs = [...thresholdInputs];
                    newInputs[i] = e.target.value;
                    setThresholdInputs(newInputs);
                  }}
                  disabled={i === 0}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">分</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>取消</Button>
            <Button onClick={handleSaveSettings}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
