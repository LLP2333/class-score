'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loginUser, registerUser } from '@/store';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

export function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const result = isRegistering
        ? await registerUser(username.trim(), password.trim())
        : await loginUser(username.trim(), password.trim());

      if (result.success) {
        toast.success(isRegistering ? '注册成功' : '登录成功');
      } else {
        toast.error(result.error || '操作失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🌈</div>
          <CardTitle className="text-xl">班级积分管理系统</CardTitle>
          <CardDescription>
            {isRegistering ? '注册教师账号' : '登录以继续'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>用户名</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div>
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            <LogIn className="h-4 w-4 mr-1" />
            {loading ? '处理中...' : isRegistering ? '注册' : '登录'}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            {isRegistering ? (
              <>已有账号？<button className="text-primary hover:underline" onClick={() => setIsRegistering(false)}>去登录</button></>
            ) : (
              <>教师注册？<button className="text-primary hover:underline" onClick={() => setIsRegistering(true)}>创建账号</button></>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            学生账号由老师创建，格式为 c班级编号_姓名，请联系老师获取
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
