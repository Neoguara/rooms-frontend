import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { components } from '@/api/schema'
import { useAPI } from '#/hooks/use-api'
import { useState } from 'react'
import { toast } from 'sonner'

type UserResponse = components['schemas']['UserResponse']

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponse | null
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
}: DeleteUserDialogProps) {
  
  const { api } = useAPI()
  const deleteMutation = api.users.deleteById.useMutation()
  const [isDeleting, setIsDeleting ] = useState(false)

  const handleDelete = async () => {
    if (!user?.id) return
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ path: { id: user.id } })
      await api.users.findAll.invalidateQueries()
      toast.success('Usuário excluído com sucesso.')
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao excluir usuário.')
    } finally {
      setTimeout(() => setIsDeleting(false), 300)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o Usuários
            <span className="font-semibold"> {user?.name}</span>?
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 focus:ring-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            asChild
          >
            <Button variant="destructive" disabled={isDeleting}>
              <Trash2 className="mr-2 size-4" />
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
