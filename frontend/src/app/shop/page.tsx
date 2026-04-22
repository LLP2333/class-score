'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProductStore, useStudentStore, useAuthStore } from '@/store';
import { cn, getAvatarClass, formatRelativeTime } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ShoppingCart, History } from 'lucide-react';

const productIcons = ['🎁', '📓', '🖍️', '✏️', '🎫', '🏀', '📚', '🎨', '🎮', '🍬'];

export default function ShopPage() {
  const { products, exchanges, addProduct, updateProduct, deleteProduct, addExchange } = useProductStore();
  const { students, getStudentById } = useStudentStore();
  const isTeacher = useAuthStore((s) => s.role === 'teacher');
  const currentClassId = useAuthStore((s) => s.currentClassId);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [icon, setIcon] = useState('🎁');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const eligibleStudents = useMemo(() => {
    if (!selectedProduct) return [];
    return students.filter(s => s.total_score >= selectedProduct.price);
  }, [students, selectedProduct]);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setName(''); setPrice(''); setStock('10'); setIcon('🎁');
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name); setPrice(product.price.toString());
    setStock(product.stock.toString()); setIcon(product.icon);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!name.trim()) { toast.error('请输入商品名称'); return; }
    if (!price || parseInt(price) <= 0) { toast.error('请输入有效价格'); return; }
    if (!currentClassId) return;

    if (editingProduct) {
      await updateProduct(editingProduct.id, { name: name.trim(), price: parseInt(price), stock: parseInt(stock) || 0, icon });
      toast.success('商品已更新');
    } else {
      await addProduct(currentClassId, { name: name.trim(), price: parseInt(price), stock: parseInt(stock) || 10, icon });
      toast.success('商品已添加');
    }
    setProductModalOpen(false);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`确定要删除商品"${product.name}"吗？`)) {
      await deleteProduct(product.id);
      toast.success('商品已删除');
    }
  };

  const handleOpenExchange = (product: Product) => {
    if (product.stock <= 0) { toast.error('库存不足'); return; }
    setSelectedProduct(product);
    setSelectedStudentId('');
    setExchangeModalOpen(true);
  };

  const handleExchange = async () => {
    if (!selectedProduct || !selectedStudentId || !currentClassId) return;
    const student = getStudentById(parseInt(selectedStudentId));
    if (!student) return;
    if (student.total_score < selectedProduct.price) { toast.error('积分不足'); return; }

    const result = await addExchange(currentClassId, { student_id: student.id, product_id: selectedProduct.id });
    if (result) {
      toast.success(`${student.name} 成功兑换 ${selectedProduct.name}`);
      useStudentStore.getState().fetchStudents(currentClassId);
    }
    setExchangeModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🛒</span>
          积分商城
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHistoryModalOpen(true)}>
            <History className="h-4 w-4 mr-1" />
            兑换记录
          </Button>
          {isTeacher && (
            <Button onClick={handleOpenAddProduct}>
              <Plus className="h-4 w-4 mr-1" />
              添加商品
            </Button>
          )}
        </div>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-5xl mb-2">{product.icon}</div>
                  <div className="font-semibold truncate">{product.name}</div>
                  <div className="text-primary font-bold text-lg mt-1">{product.price} 积分</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    库存: {product.stock} | 已兑换: {product.exchange_count}
                  </div>
                </div>
                {isTeacher && (
                  <div className="flex gap-2 mt-3">
                    <Button variant="default" size="sm" className="flex-1" disabled={product.stock <= 0} onClick={() => handleOpenExchange(product)}>
                      <ShoppingCart className="h-3 w-3 mr-1" />兑换
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEditProduct(product)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteProduct(product)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium mb-2">商城暂无商品</h3>
          {isTeacher && <Button onClick={handleOpenAddProduct}>添加商品</Button>}
        </div>
      )}

      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProduct ? '编辑商品' : '添加商品'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-2 block">商品名称 *</label><Input placeholder="例如：笔记本" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-2 block">所需积分 *</label><Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-2 block">库存数量</label><Input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} /></div>
            <div>
              <label className="text-sm font-medium mb-2 block">商品图标</label>
              <div className="flex flex-wrap gap-2">
                {productIcons.map(i => (
                  <button key={i} type="button" className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${icon === i ? 'bg-primary text-white scale-110' : 'bg-muted hover:bg-muted/80'}`} onClick={() => setIcon(i)}>{i}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveProduct}>{editingProduct ? '保存' : '添加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={exchangeModalOpen} onOpenChange={setExchangeModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>兑换商品</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-5xl mb-2">{selectedProduct.icon}</div>
                <div className="font-semibold text-lg">{selectedProduct.name}</div>
                <div className="text-primary font-bold text-xl mt-1">{selectedProduct.price} 积分</div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">选择学生</label>
                {eligibleStudents.length > 0 ? (
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger><SelectValue placeholder="选择有足够积分的学生" /></SelectTrigger>
                    <SelectContent>
                      {eligibleStudents.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.total_score}分)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">没有学生有足够积分</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExchangeModalOpen(false)}>取消</Button>
            <Button onClick={handleExchange} disabled={!selectedStudentId}>确认兑换</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>兑换记录</DialogTitle></DialogHeader>
          <ScrollArea className="h-80">
            {exchanges.length > 0 ? (
              <div className="space-y-2">
                {[...exchanges].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((exchange) => {
                  const student = getStudentById(exchange.student_id);
                  return (
                    <div key={exchange.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {student && (
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold', getAvatarClass(student.avatar))}>
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{student?.name || '未知'}</div>
                        <div className="text-sm text-muted-foreground">兑换了 {exchange.product_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">-{exchange.price}分</div>
                        <div className="text-xs text-muted-foreground">{formatRelativeTime(exchange.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无兑换记录</p>
            )}
          </ScrollArea>
          <DialogFooter><Button onClick={() => setHistoryModalOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
