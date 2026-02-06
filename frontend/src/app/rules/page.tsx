'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRuleStore, initDefaultData } from '@/store';
import type { Rule } from '@/types';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const categories = ['学习', '纪律', '品德', '劳动', '其他'];
const icons = ['✋', '📝', '🤝', '⭐', '🧹', '⏰', '❌', '🗣️', '📌', '🎯', '💪', '🏃'];

export default function RulesPage() {
  const { rules, addRule, updateRule, deleteRule } = useRuleStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [type, setType] = useState<'add' | 'minus'>('add');
  const [category, setCategory] = useState('学习');
  const [icon, setIcon] = useState('📌');

  // Initialize default rules
  useEffect(() => {
    initDefaultData();
  }, []);

  const addRules = rules.filter(r => r.type === 'add');
  const minusRules = rules.filter(r => r.type === 'minus');

  const handleOpenAdd = () => {
    setEditingRule(null);
    setName('');
    setScore('');
    setType('add');
    setCategory('学习');
    setIcon('📌');
    setModalOpen(true);
  };

  const handleOpenEdit = (rule: Rule) => {
    setEditingRule(rule);
    setName(rule.name);
    setScore(rule.score.toString());
    setType(rule.type);
    setCategory(rule.category);
    setIcon(rule.icon);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('请输入规则名称');
      return;
    }
    if (!score || parseInt(score) <= 0) {
      toast.error('请输入有效分值');
      return;
    }

    if (editingRule) {
      updateRule(editingRule.id, {
        name: name.trim(),
        score: parseInt(score),
        type,
        category,
        icon,
      });
      toast.success('规则已更新');
    } else {
      addRule({
        name: name.trim(),
        score: parseInt(score),
        type,
        category,
        icon,
      });
      toast.success('规则已添加');
    }
    setModalOpen(false);
  };

  const handleDelete = (rule: Rule) => {
    if (confirm(`确定要删除规则"${rule.name}"吗？`)) {
      deleteRule(rule.id);
      toast.success('规则已删除');
    }
  };

  const RuleCard = ({ rule }: { rule: Rule }) => (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-shadow">
      <div className="text-2xl">{rule.icon}</div>
      <div className="flex-1">
        <div className="font-medium">{rule.name}</div>
        <Badge variant="secondary" className="text-xs mt-1">{rule.category}</Badge>
      </div>
      <div className={`font-bold ${rule.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
        {rule.type === 'add' ? '+' : '-'}{rule.score}分
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(rule)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(rule)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>📋</span>
          积分规则
        </h2>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-1" />
          添加规则
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Add Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <span>➕</span> 加分规则 ({addRules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {addRules.length > 0 ? (
              addRules.map(rule => <RuleCard key={rule.id} rule={rule} />)
            ) : (
              <p className="text-muted-foreground text-center py-4">暂无加分规则</p>
            )}
          </CardContent>
        </Card>

        {/* Minus Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <span>➖</span> 扣分规则 ({minusRules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {minusRules.length > 0 ? (
              minusRules.map(rule => <RuleCard key={rule.id} rule={rule} />)
            ) : (
              <p className="text-muted-foreground text-center py-4">暂无扣分规则</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? '编辑规则' : '添加规则'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">规则名称 *</label>
              <Input
                placeholder="例如：课堂回答问题"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">分值 *</label>
              <Input
                type="number"
                min={1}
                placeholder="输入分值"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">类型</label>
              <Select value={type} onValueChange={(v) => setType(v as 'add' | 'minus')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">加分</SelectItem>
                  <SelectItem value="minus">扣分</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">分类</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">图标</label>
              <div className="flex flex-wrap gap-2">
                {icons.map(i => (
                  <button
                    key={i}
                    type="button"
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      icon === i ? 'bg-primary text-white scale-110' : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setIcon(i)}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave}>{editingRule ? '保存' : '添加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
