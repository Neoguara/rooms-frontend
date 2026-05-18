import { Crown, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { components } from '@/api/schema'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useAPI } from '#/hooks/use-api'

import { toast } from "sonner";

type UserRole = 'ADMIN' | 'USER'
type UserResponse = components['schemas']['UserResponse']

export interface UserFormData {
  name: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUser: UserResponse | null
}

export const UserFormDialog = memo(function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
}: UserFormDialogProps) {

  const { api } = useAPI()

  const createMutation = api.users.create.useMutation()
  const updateMutation = api.users.update.useMutation()
  const updateStatusMutation = api.users.updateStatus.useMutation()
  // const isSaving = createMutation.isPending || updateMutation.isPending

  const [ isSaving, setIsSaving ] = useState(false)

  const [formData, setFormData] = useState<UserFormData>({
    name:  editingUser?.name || '',
    email: editingUser?.email || '',
    password: '',
    role: editingUser?.role || 'USER',
    isActive: editingUser?.status === 'ACTIVE',
  })

  const handleSave = useCallback(
    async (data: UserFormData) => {
      setIsSaving(true)
      try {
      if (editingUser?.id) {
        await updateMutation.mutateAsync({
          body: {
            name: data.name,
            email: data.email,
            role: data.role,
            ...(data.password ? { password: data.password } : {}),
          },
          path: { id: editingUser.id },
        })
        const currentlyActive = editingUser.status === 'ACTIVE'
        if (data.isActive !== currentlyActive) {
          await updateStatusMutation.mutateAsync({
            path: { id: editingUser.id },
            body: { status: data.isActive ? 'ACTIVE' : 'INACTIVE' },
          })
        }
        await api.users.findAll.invalidateQueries()
        toast.success('Usuário atualizado com sucesso.')
      } else {
        await createMutation.mutateAsync({
          body: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
          },
        })
        await api.users.findAll.invalidateQueries()
        toast.success('Usuário cadastrado com sucesso.')
      }
      onOpenChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : (editingUser?.id ? 'Erro ao atualizar usuário.' : 'Erro ao cadastrar usuário.'))
      } finally {
        setTimeout(() => setIsSaving(false), 300)
      }


    },
    [editingUser?.id, updateMutation.mutateAsync, createMutation.mutateAsync],
  )

  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) {
      setFormData(
        editingUser
          ? {
              name: editingUser.name ?? '',
              email: editingUser.email ?? '',
              password: '',
              role: (editingUser.role as UserRole) ?? 'USER',
              isActive: editingUser.status === 'ACTIVE',
            }
          : { name: '', email: '', password: '', role: 'USER', isActive: true },
      )
    }
    wasOpen.current = open
  }, [open, editingUser])

  const isDisabled =
    !formData.name ||
    !formData.email ||
    (!editingUser && !formData.password) ||
    isSaving

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {editingUser
              ? 'Atualize as informações do usuário.'
              : 'Preencha as informações para cadastrar um novo usuário.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nome Completo</label>
            <Input
              placeholder="Ex: João Silva"
              autoComplete="off"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              autoComplete="off"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              {editingUser
                ? 'Nova Senha (deixe em branco para manter)'
                : 'Senha'}
            </label>
            <Input
              type="password"
              placeholder={editingUser ? '••••••••' : 'Senha de acesso'}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!editingUser}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Perfil</label>
            <Select
              value={formData.role}
              onValueChange={(v: UserRole) =>
                setFormData({ ...formData, role: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">
                  <div className="flex items-center gap-2">
                    <User className="size-4" />
                    Usuário
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Crown className="size-4" />
                    Administrador
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {editingUser && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="grid gap-0.5">
                <label className="text-sm font-medium">Usuário Ativo</label>
                <p className="text-xs text-muted-foreground">
                  Usuários inativos não conseguem fazer login
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => handleSave(formData)} disabled={isDisabled} className="min-w-40">
            {isSaving
              ? 'Salvando...'
              : editingUser
                ? 'Salvar Alterações'
                : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
