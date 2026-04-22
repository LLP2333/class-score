'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { LogOut, Plus, Upload, Database } from 'lucide-react';

export function CreateClassGuide() {
  const { username, hasLegacyData, clearAuth, setClasses, setCurrentClassId, setHasLegacyData } = useAuthStore();
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const importJsonRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!className.trim()) {
      toast.error('请输入班级名称');
      return;
    }

    setLoading(true);
    try {
      const result = await api.createClass(className.trim(), teacherName.trim() || '班主任');
      if (result.success && result.data) {
        toast.success('班级创建成功！');
        const classResult = await api.listClasses();
        if (classResult.success && classResult.data) {
          setClasses(classResult.data);
          setCurrentClassId(result.data.id);
        }
      } else {
        toast.error(result.error || '创建失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateLegacy = async () => {
    setLoading(true);
    try {
      const result = await api.migrateLegacy();
      if (result.success && result.data) {
        toast.success(`迁移成功！导入了 ${result.data.student_count} 名学生、${result.data.record_count} 条记录`);
        setHasLegacyData(false);
        const classResult = await api.listClasses();
        if (classResult.success && classResult.data) {
          setClasses(classResult.data);
          if (result.data.class_id) {
            setCurrentClassId(result.data.class_id);
          }
        }
      } else {
        toast.error(result.error || '迁移失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const result = await api.migrateImport(data);
        if (result.success && result.data) {
          toast.success(`导入成功！${result.data.student_count} 名学生、${result.data.record_count} 条记录`);
          const classResult = await api.listClasses();
          if (classResult.success && classResult.data) {
            setClasses(classResult.data);
            if (result.data.class_id) {
              setCurrentClassId(result.data.class_id);
            }
          }
        } else {
          toast.error(result.error || '导入失败');
        }
      } catch {
        toast.error('文件格式错误');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    if (importJsonRef.current) importJsonRef.current.value = '';
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🏫</div>
          <CardTitle className="text-xl">欢迎使用班级积分系统</CardTitle>
          <CardDescription>
            {username}，请创建班级或导入已有数据
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Option 1: Create new class */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">方式一：创建新班级</h3>
            <div>
              <Label>班级名称 *</Label>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="例如：三年二班"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <Label>班主任姓名</Label>
              <Input
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="选填，默认为「班主任」"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              {loading ? '处理中...' : '创建班级'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">或</span>
            </div>
          </div>

          {/* Option 2: Import data */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">方式二：导入已有数据</h3>
            <p className="text-xs text-muted-foreground">导入后将自动创建班级，学生账号默认密码为 123456</p>

            {hasLegacyData && (
              <Button variant="outline" onClick={handleMigrateLegacy} disabled={loading} className="w-full">
                <Database className="h-4 w-4 mr-1" />
                导入服务器历史数据
              </Button>
            )}

            <Button variant="outline" onClick={() => importJsonRef.current?.click()} disabled={loading} className="w-full">
              <Upload className="h-4 w-4 mr-1" />
              从 JSON 备份文件导入
            </Button>
            <input ref={importJsonRef} type="file" accept=".json" className="hidden" onChange={handleImportJson} />
          </div>

          <div className="text-center pt-2">
            <button
              onClick={clearAuth}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              退出登录
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
