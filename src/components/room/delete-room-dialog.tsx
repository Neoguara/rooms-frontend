import { memo, useCallback, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { components } from '@/api/schema'
import { useAPI } from '@/hooks/use-api'
import { toast } from 'sonner'

type RoomDetailResponse = components['schemas']['RoomDetailResponse']

interface DeleteRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: RoomDetailResponse | null
}

export const DeleteRoomDialog = memo(function DeleteRoomDialog({
  open,
  onOpenChange,
  room,
}: DeleteRoomDialogProps) {
  const { api } = useAPI()
  const deleteMutation = api.rooms.deleteRoom.useMutation()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!room?.id) return
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ path: { id: room.id } })
      await api.rooms.listRooms.invalidateQueries()
      toast.success('Sala excluída com sucesso.')
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao excluir sala.')
    } finally {
      setTimeout(() => setIsDeleting(false), 300)
    }
  }, [room?.id, deleteMutation, api, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a sala{' '}
            <strong>{room?.name}</strong> ({room?.code})? Esta ação não pode
            ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="mr-2 size-4" />
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
