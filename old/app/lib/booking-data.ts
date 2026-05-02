// Tipos principais do sistema de reservas

export type BookingStatus = 
  | "pendente" 
  | "aprovada" 
  | "rejeitada" 
  | "cancelada"
  | "em_andamento"
  | "concluida"

export type RoomType = 
  | "sala_aula" 
  | "laboratorio" 
  | "auditorio" 
  | "sala_reuniao"

export type RecurrenceType = 
  | "none" 
  | "daily" 
  | "weekly" 
  | "monthly"

export interface Room {
  id: string
  name: string
  code: string
  type: RoomType
  building: string
  floor: number
  capacity: number
  resources: string[]
  image?: string
  isActive: boolean
}

export interface TimeSlot {
  id: string
  label: string
  startTime: string // "07:00"
  endTime: string   // "08:40"
}

export interface BookingHistoryItem {
  id: string
  action: "criada" | "aprovada" | "rejeitada" | "cancelada" | "editada" | "comentario"
  userId: string
  userName: string
  userRole: string
  message?: string
  timestamp: string
  details?: string
}

export interface Booking {
  id: string
  roomId: string
  userId: string
  userName: string
  userEmail: string
  title: string
  description?: string
  date: string // ISO date
  startTime: string
  endTime: string
  status: BookingStatus
  participants?: number
  recurrence: RecurrenceType
  recurrenceEndDate?: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  color?: string
  history?: BookingHistoryItem[]
}

export interface BookingRequest {
  id: string
  booking: Booking
  requestType: "new" | "change" | "cancel" | "swap"
  originalBookingId?: string
  swapWithUserId?: string
  swapWithUserName?: string
  message?: string
  status: "pendente" | "aprovada" | "rejeitada"
  createdAt: string
  respondedAt?: string
  respondedBy?: string
  responseMessage?: string
  // Agrupamento por sessão de edição
  editSessionId?: string
}

export interface EditSessionAction {
  id: string
  type: "add" | "edit" | "swap" | "remove"
  description: string
  booking: Booking
  originalBooking?: Booking
  swapTarget?: Booking
  status: "pendente" | "aprovada" | "rejeitada"
  respondedAt?: string
  respondedBy?: string
  responseMessage?: string
}

export interface EditSession {
  id: string
  userId: string
  userName: string
  userEmail: string
  userRole: string
  title: string
  description?: string
  actions: EditSessionAction[]
  status: "pendente" | "parcial" | "aprovada" | "rejeitada"
  createdAt: string
  updatedAt: string
  respondedAt?: string
  respondedBy?: string
  responseMessage?: string
}

// Horários padrão da instituição
export const timeSlots: TimeSlot[] = [
  { id: "1", label: "1º Horário", startTime: "07:00", endTime: "07:50" },
  { id: "2", label: "2º Horário", startTime: "07:50", endTime: "08:40" },
  { id: "3", label: "3º Horário", startTime: "08:55", endTime: "09:45" },
  { id: "4", label: "4º Horário", startTime: "09:45", endTime: "10:35" },
  { id: "5", label: "5º Horário", startTime: "10:50", endTime: "11:40" },
  { id: "6", label: "6º Horário", startTime: "11:40", endTime: "12:30" },
  { id: "7", label: "7º Horário", startTime: "13:30", endTime: "14:20" },
  { id: "8", label: "8º Horário", startTime: "14:20", endTime: "15:10" },
  { id: "9", label: "9º Horário", startTime: "15:25", endTime: "16:15" },
  { id: "10", label: "10º Horário", startTime: "16:15", endTime: "17:05" },
  { id: "11", label: "11º Horário", startTime: "17:20", endTime: "18:10" },
  { id: "12", label: "12º Horário", startTime: "18:10", endTime: "19:00" },
  { id: "13", label: "13º Horário", startTime: "19:00", endTime: "19:50" },
  { id: "14", label: "14º Horário", startTime: "19:50", endTime: "20:40" },
  { id: "15", label: "15º Horário", startTime: "20:55", endTime: "21:45" },
  { id: "16", label: "16º Horário", startTime: "21:45", endTime: "22:35" },
]

// Função para gerar salas em massa
function generateRooms(): Room[] {
  const generatedRooms: Room[] = []
  
  // Bloco A - Salas de Aula (16 salas, 4 por andar)
  for (let floor = 1; floor <= 4; floor++) {
    for (let room = 1; room <= 4; room++) {
      const roomNum = `${floor}0${room}`
      generatedRooms.push({
        id: `a-${roomNum}`,
        name: `Sala ${roomNum}`,
        code: `BL-A-${roomNum}`,
        type: "sala_aula",
        building: "Bloco A",
        floor,
        capacity: 40 + (floor * 5),
        resources: ["Projetor", "Ar Condicionado", "Quadro Branco"],
        isActive: true,
      })
    }
  }
  
  // Bloco B - Laboratórios (12 labs)
  const labTypes = ["Informática", "Redes", "Hardware", "Programação"]
  for (let floor = 1; floor <= 3; floor++) {
    for (let lab = 1; lab <= 4; lab++) {
      const labNum = `${floor}0${lab}`
      generatedRooms.push({
        id: `b-${labNum}`,
        name: `Lab. ${labTypes[(floor - 1) % labTypes.length]} ${lab}`,
        code: `BL-B-${labNum}`,
        type: "laboratorio",
        building: "Bloco B",
        floor,
        capacity: 30,
        resources: ["Computadores", "Projetor", "Ar Condicionado", "Software Especializado"],
        isActive: true,
      })
    }
  }
  
  // Bloco C - Auditórios e Salas Especiais (6 espaços)
  generatedRooms.push(
    {
      id: "c-001",
      name: "Auditório Principal",
      code: "BL-C-001",
      type: "auditorio",
      building: "Bloco C",
      floor: 0,
      capacity: 300,
      resources: ["Projetor", "Sistema de Som", "Ar Condicionado", "Microfones", "Palco"],
      isActive: true,
    },
    {
      id: "c-002",
      name: "Auditório Secundário",
      code: "BL-C-002",
      type: "auditorio",
      building: "Bloco C",
      floor: 0,
      capacity: 150,
      resources: ["Projetor", "Sistema de Som", "Ar Condicionado", "Microfones"],
      isActive: true,
    },
    {
      id: "c-101",
      name: "Mini Auditório 1",
      code: "BL-C-101",
      type: "auditorio",
      building: "Bloco C",
      floor: 1,
      capacity: 80,
      resources: ["Projetor", "Sistema de Som", "Ar Condicionado"],
      isActive: true,
    },
    {
      id: "c-102",
      name: "Mini Auditório 2",
      code: "BL-C-102",
      type: "auditorio",
      building: "Bloco C",
      floor: 1,
      capacity: 80,
      resources: ["Projetor", "Sistema de Som", "Ar Condicionado"],
      isActive: true,
    },
    {
      id: "c-201",
      name: "Sala Videoconferência",
      code: "BL-C-201",
      type: "sala_reuniao",
      building: "Bloco C",
      floor: 2,
      capacity: 20,
      resources: ["TV 75\"", "Videoconferência", "Ar Condicionado", "Lousa Digital"],
      isActive: true,
    },
    {
      id: "c-202",
      name: "Sala de Defesas",
      code: "BL-C-202",
      type: "sala_reuniao",
      building: "Bloco C",
      floor: 2,
      capacity: 25,
      resources: ["Projetor", "Ar Condicionado", "Webcam"],
      isActive: true,
    }
  )
  
  // Bloco D - Salas de Aula Novas (15 salas)
  for (let floor = 1; floor <= 3; floor++) {
    for (let room = 1; room <= 5; room++) {
      const roomNum = `${floor}0${room}`
      generatedRooms.push({
        id: `d-${roomNum}`,
        name: `Sala D-${roomNum}`,
        code: `BL-D-${roomNum}`,
        type: "sala_aula",
        building: "Bloco D",
        floor,
        capacity: 50,
        resources: ["Projetor 4K", "Ar Condicionado", "Quadro Interativo", "Sistema de Som"],
        isActive: true,
      })
    }
  }
  
  // Bloco E - Salas de Reunião e Estudos (8 salas)
  for (let floor = 1; floor <= 2; floor++) {
    for (let room = 1; room <= 4; room++) {
      const roomNum = `${floor}0${room}`
      const isStudyRoom = room <= 2
      generatedRooms.push({
        id: `e-${roomNum}`,
        name: isStudyRoom ? `Sala de Estudos ${floor}-${room}` : `Sala de Reuniões ${floor}-${room}`,
        code: `BL-E-${roomNum}`,
        type: "sala_reuniao",
        building: "Bloco E",
        floor,
        capacity: isStudyRoom ? 8 : 12,
        resources: isStudyRoom 
          ? ["Quadro Branco", "Ar Condicionado", "Tomadas USB"]
          : ["TV", "Videoconferência", "Ar Condicionado", "Quadro Branco"],
        isActive: true,
      })
    }
  }
  
  // Bloco F - Laboratórios Especializados (8 labs)
  const specialLabs = [
    { name: "Lab. Química", resources: ["Bancadas", "Exaustor", "Ar Condicionado", "Chuveiro de Emergência"] },
    { name: "Lab. Física", resources: ["Bancadas", "Equipamentos de Medição", "Ar Condicionado"] },
    { name: "Lab. Biologia", resources: ["Microscópios", "Bancadas", "Ar Condicionado", "Refrigerador"] },
    { name: "Lab. Eletrônica", resources: ["Bancadas", "Osciloscópios", "Ar Condicionado", "Fontes de Alimentação"] },
    { name: "Lab. Robótica", resources: ["Kits de Robótica", "Computadores", "Ar Condicionado", "Impressora 3D"] },
    { name: "Lab. Maker", resources: ["Ferramentas", "Impressoras 3D", "Cortadora Laser", "Ar Condicionado"] },
    { name: "Lab. Mecânica", resources: ["Máquinas CNC", "Tornos", "Ar Condicionado", "EPI"] },
    { name: "Lab. Automação", resources: ["CLPs", "Sensores", "Ar Condicionado", "Computadores"] },
  ]
  
  specialLabs.forEach((lab, index) => {
    const floor = Math.floor(index / 2) + 1
    const roomNum = (index % 2) + 1
    generatedRooms.push({
      id: `f-${floor}0${roomNum}`,
      name: lab.name,
      code: `BL-F-${floor}0${roomNum}`,
      type: "laboratorio",
      building: "Bloco F",
      floor,
      capacity: 24,
      resources: lab.resources,
      isActive: true,
    })
  })
  
  return generatedRooms
}

// Salas disponíveis (65 salas no total)
export const rooms: Room[] = generateRooms()

// Lista de prédios disponíveis
export const buildings = [...new Set(rooms.map(r => r.building))].sort()

// Cores para reservas por usuário
export const bookingColors = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

// Reservas de exemplo
export const initialBookings: Booking[] = [
  // === Reservas do Prof. Carlos Silva (userId: 1) ===
  {
    id: "1",
    roomId: "1",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Engenharia de Software I",
    description: "Aula regular da disciplina - Introdução a padrões de projeto",
    date: "2026-03-09",
    startTime: "07:00",
    endTime: "08:40",
    status: "aprovada",
    participants: 35,
    recurrence: "weekly",
    recurrenceEndDate: "2026-07-01",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    approvedBy: "3",
    approvedAt: "2026-02-02T14:00:00Z",
    color: "#10b981",
    history: [
      {
        id: "h1",
        action: "criada",
        userId: "1",
        userName: "Prof. Carlos Silva",
        userRole: "Professor",
        timestamp: "2026-02-01T10:00:00Z",
        message: "Solicitação de reserva criada para aulas regulares do semestre",
      },
      {
        id: "h2",
        action: "comentario",
        userId: "3",
        userName: "Dr. João Oliveira",
        userRole: "Coordenador",
        timestamp: "2026-02-01T15:30:00Z",
        message: "Verificado disponibilidade. Sala OK para o horário solicitado.",
      },
      {
        id: "h3",
        action: "aprovada",
        userId: "3",
        userName: "Dr. João Oliveira",
        userRole: "Coordenador",
        timestamp: "2026-02-02T14:00:00Z",
        message: "Reserva aprovada. Bom semestre!",
      },
    ],
  },
  {
    id: "2",
    roomId: "1",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Engenharia de Software I",
    description: "Continuação - Padrões Criacionais",
    date: "2026-03-10",
    startTime: "07:00",
    endTime: "08:40",
    status: "aprovada",
    participants: 35,
    recurrence: "weekly",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    color: "#10b981",
  },
  {
    id: "3",
    roomId: "1",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Engenharia de Software I",
    description: "Prática de padrões de projeto",
    date: "2026-03-11",
    startTime: "07:00",
    endTime: "08:40",
    status: "aprovada",
    participants: 35,
    recurrence: "weekly",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    color: "#10b981",
  },
  {
    id: "5",
    roomId: "3",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Laboratório de Programação",
    description: "Atividade prática de Java",
    date: "2026-03-09",
    startTime: "10:50",
    endTime: "12:30",
    status: "aprovada",
    participants: 28,
    recurrence: "weekly",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    color: "#10b981",
  },
  {
    id: "6",
    roomId: "3",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Laboratório de Programação",
    description: "Atividade prática de Python",
    date: "2026-03-10",
    startTime: "10:50",
    endTime: "12:30",
    status: "aprovada",
    participants: 28,
    recurrence: "weekly",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    color: "#10b981",
  },
  {
    id: "9",
    roomId: "7",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Estrutura de Dados",
    description: "Árvores e Grafos",
    date: "2026-03-12",
    startTime: "13:30",
    endTime: "15:10",
    status: "aprovada",
    participants: 42,
    recurrence: "weekly",
    createdAt: "2026-02-15T10:00:00Z",
    updatedAt: "2026-02-15T10:00:00Z",
    color: "#10b981",
  },
  {
    id: "10",
    roomId: "4",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Monitoria de Programação",
    description: "Atendimento aos alunos com dúvidas",
    date: "2026-03-14",
    startTime: "08:55",
    endTime: "10:35",
    status: "pendente",
    participants: 15,
    recurrence: "weekly",
    createdAt: "2026-03-08T10:00:00Z",
    updatedAt: "2026-03-08T10:00:00Z",
    color: "#10b981",
    history: [
      {
        id: "h10-1",
        action: "criada",
        userId: "1",
        userName: "Prof. Carlos Silva",
        userRole: "Professor",
        timestamp: "2026-03-08T10:00:00Z",
        message: "Solicitação de reserva para monitoria semanal",
      },
    ],
  },
  {
    id: "11",
    roomId: "5",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Defesa de TCC - Turma 2026",
    description: "Apresentação dos trabalhos de conclusão de curso",
    date: "2026-03-20",
    startTime: "14:20",
    endTime: "17:05",
    status: "pendente",
    participants: 50,
    recurrence: "none",
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-03-10T10:00:00Z",
    color: "#10b981",
  },
  {
    id: "12",
    roomId: "2",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Aula Cancelada - Feriado",
    description: "Aula cancelada devido ao feriado municipal",
    date: "2026-03-05",
    startTime: "07:00",
    endTime: "08:40",
    status: "cancelada",
    participants: 35,
    recurrence: "none",
    createdAt: "2026-02-28T10:00:00Z",
    updatedAt: "2026-03-04T10:00:00Z",
    color: "#10b981",
  },
  {
    id: "13",
    roomId: "6",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    title: "Reunião NDE",
    description: "Reunião do Núcleo Docente Estruturante",
    date: "2026-03-06",
    startTime: "10:50",
    endTime: "12:30",
    status: "concluida",
    participants: 8,
    recurrence: "none",
    createdAt: "2026-02-25T10:00:00Z",
    updatedAt: "2026-03-06T12:30:00Z",
    color: "#10b981",
  },
  // === Reservas da Maria Santos (userId: 2) ===
  {
    id: "4",
    roomId: "2",
    userId: "2",
    userName: "Maria Santos",
    userEmail: "funcionario@edu.br",
    title: "Treinamento de Sistemas",
    description: "Treinamento do novo sistema acadêmico para funcionários",
    date: "2026-03-10",
    startTime: "08:55",
    endTime: "10:35",
    status: "aprovada",
    participants: 20,
    recurrence: "none",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
    color: "#3b82f6",
  },
  {
    id: "8",
    roomId: "4",
    userId: "2",
    userName: "Maria Santos",
    userEmail: "funcionario@edu.br",
    title: "Curso de Excel Avançado",
    description: "Capacitação em planilhas eletrônicas para equipe administrativa",
    date: "2026-03-13",
    startTime: "13:30",
    endTime: "17:05",
    status: "pendente",
    participants: 25,
    recurrence: "none",
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-03-05T10:00:00Z",
    color: "#3b82f6",
  },
  {
    id: "14",
    roomId: "6",
    userId: "2",
    userName: "Maria Santos",
    userEmail: "funcionario@edu.br",
    title: "Reunião de Planejamento",
    description: "Planejamento do calendário acadêmico 2026/2",
    date: "2026-03-11",
    startTime: "14:20",
    endTime: "15:10",
    status: "aprovada",
    participants: 10,
    recurrence: "none",
    createdAt: "2026-03-02T10:00:00Z",
    updatedAt: "2026-03-02T14:00:00Z",
    color: "#3b82f6",
  },
  {
    id: "15",
    roomId: "1",
    userId: "2",
    userName: "Maria Santos",
    userEmail: "funcionario@edu.br",
    title: "Orientação de Matrícula",
    description: "Atendimento aos calouros para orientação de matrícula",
    date: "2026-03-16",
    startTime: "08:55",
    endTime: "12:30",
    status: "pendente",
    participants: 40,
    recurrence: "none",
    createdAt: "2026-03-09T10:00:00Z",
    updatedAt: "2026-03-09T10:00:00Z",
    color: "#3b82f6",
  },
  {
    id: "16",
    roomId: "5",
    userId: "2",
    userName: "Maria Santos",
    userEmail: "funcionario@edu.br",
    title: "Recepção de Calouros",
    description: "Evento de boas-vindas aos novos alunos",
    date: "2026-03-02",
    startTime: "19:00",
    endTime: "21:45",
    status: "concluida",
    participants: 150,
    recurrence: "none",
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-03-02T21:45:00Z",
    color: "#3b82f6",
  },
  {
    id: "17",
    roomId: "3",
    userId: "2",
    userName: "Maria Santos",
    userEmail: "funcionario@edu.br",
    title: "Workshop de Informática",
    description: "Workshop básico de informática para terceira idade",
    date: "2026-03-08",
    startTime: "13:30",
    endTime: "15:10",
    status: "rejeitada",
    participants: 20,
    recurrence: "none",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-03T10:00:00Z",
    rejectionReason: "Laboratório já reservado para manutenção preventiva",
    color: "#3b82f6",
    history: [
      {
        id: "h17-1",
        action: "criada",
        userId: "2",
        userName: "Maria Santos",
        userRole: "Funcionário",
        timestamp: "2026-03-01T10:00:00Z",
        message: "Solicitação de reserva para workshop de inclusão digital",
      },
      {
        id: "h17-2",
        action: "comentario",
        userId: "4",
        userName: "Admin Sistema",
        userRole: "Administrador",
        timestamp: "2026-03-02T09:00:00Z",
        message: "Verificando disponibilidade do laboratório...",
      },
      {
        id: "h17-3",
        action: "rejeitada",
        userId: "3",
        userName: "Dr. João Oliveira",
        userRole: "Coordenador",
        timestamp: "2026-03-03T10:00:00Z",
        message: "Infelizmente o laboratório estará em manutenção nessa data. Sugiro reagendar para a semana seguinte.",
      },
    ],
  },
  // === Reservas do Dr. João Oliveira - Coordenador (userId: 3) ===
  {
    id: "7",
    roomId: "5",
    userId: "3",
    userName: "Dr. João Oliveira",
    userEmail: "coordenador@edu.br",
    title: "Palestra: Mercado de TI",
    description: "Palestra sobre tendências e oportunidades no mercado de tecnologia",
    date: "2026-03-12",
    startTime: "19:00",
    endTime: "20:40",
    status: "aprovada",
    participants: 120,
    recurrence: "none",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
    color: "#f59e0b",
  },
  {
    id: "18",
    roomId: "6",
    userId: "3",
    userName: "Dr. João Oliveira",
    userEmail: "coordenador@edu.br",
    title: "Reunião de Colegiado",
    description: "Reunião mensal do colegiado do curso",
    date: "2026-03-10",
    startTime: "15:25",
    endTime: "17:05",
    status: "aprovada",
    participants: 12,
    recurrence: "monthly",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    color: "#f59e0b",
  },
  {
    id: "19",
    roomId: "1",
    userId: "3",
    userName: "Dr. João Oliveira",
    userEmail: "coordenador@edu.br",
    title: "Banco de Dados II",
    description: "Aula de NoSQL e bancos distribuídos",
    date: "2026-03-11",
    startTime: "13:30",
    endTime: "15:10",
    status: "aprovada",
    participants: 38,
    recurrence: "weekly",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    color: "#f59e0b",
  },
  {
    id: "20",
    roomId: "7",
    userId: "3",
    userName: "Dr. João Oliveira",
    userEmail: "coordenador@edu.br",
    title: "Inteligência Artificial",
    description: "Introdução a Machine Learning",
    date: "2026-03-09",
    startTime: "19:00",
    endTime: "20:40",
    status: "aprovada",
    participants: 45,
    recurrence: "weekly",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    color: "#f59e0b",
  },
  {
    id: "21",
    roomId: "5",
    userId: "3",
    userName: "Dr. João Oliveira",
    userEmail: "coordenador@edu.br",
    title: "Semana Acadêmica",
    description: "Abertura da Semana Acadêmica de Computação",
    date: "2026-04-15",
    startTime: "19:00",
    endTime: "22:35",
    status: "pendente",
    participants: 200,
    recurrence: "none",
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-03-10T10:00:00Z",
    color: "#f59e0b",
  },
  {
    id: "22",
    roomId: "8",
    userId: "3",
    userName: "Dr. João Oliveira",
    userEmail: "coordenador@edu.br",
    title: "Orientação de Estágio",
    description: "Reunião com alunos sobre estágio obrigatório",
    date: "2026-03-13",
    startTime: "10:50",
    endTime: "11:40",
    status: "aprovada",
    participants: 15,
    recurrence: "none",
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-03-05T14:00:00Z",
    color: "#f59e0b",
  },
  // === Reservas do Admin (userId: 4) ===
  {
    id: "23",
    roomId: "6",
    userId: "4",
    userName: "Admin Sistema",
    userEmail: "admin@edu.br",
    title: "Manutenção do Sistema",
    description: "Janela de manutenção para atualização do sistema",
    date: "2026-03-15",
    startTime: "07:00",
    endTime: "08:40",
    status: "aprovada",
    participants: 5,
    recurrence: "none",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
    color: "#ef4444",
  },
  {
    id: "24",
    roomId: "5",
    userId: "4",
    userName: "Admin Sistema",
    userEmail: "admin@edu.br",
    title: "Conselho Universitário",
    description: "Reunião extraordinária do conselho",
    date: "2026-03-18",
    startTime: "14:20",
    endTime: "17:05",
    status: "pendente",
    participants: 30,
    recurrence: "none",
    createdAt: "2026-03-08T10:00:00Z",
    updatedAt: "2026-03-08T10:00:00Z",
    color: "#ef4444",
  },
]

// Solicitações de exemplo
export const initialRequests: BookingRequest[] = [
  // === SOLICITAÇÕES PENDENTES ===
  {
    id: "req-1",
    booking: {
      id: "new-booking-1",
      roomId: "4",
      userId: "2",
      userName: "Maria Santos",
      userEmail: "funcionario@edu.br",
      title: "Curso de Excel Avançado",
      description: "Capacitação em planilhas eletrônicas para equipe administrativa. Serão abordados tópicos como tabelas dinâmicas, macros básicas e fórmulas avançadas.",
      date: "2026-03-13",
      startTime: "13:30",
      endTime: "17:05",
      status: "pendente",
      participants: 25,
      recurrence: "none",
      createdAt: "2026-03-05T10:00:00Z",
      updatedAt: "2026-03-05T10:00:00Z",
      color: "#3b82f6",
      history: [
        {
          id: "h-req1-1",
          action: "criada",
          userId: "2",
          userName: "Maria Santos",
          userRole: "Funcionário",
          timestamp: "2026-03-05T10:00:00Z",
          message: "Solicitação criada para capacitação da equipe administrativa",
        },
      ],
    },
    requestType: "new",
    message: "Preciso do laboratório para ministrar um curso de Excel para os funcionários. O curso faz parte do programa de capacitação semestral da instituição.",
    status: "pendente",
    createdAt: "2026-03-05T10:00:00Z",
  },
  {
    id: "req-2",
    booking: {
      id: "new-booking-2",
      roomId: "1",
      userId: "2",
      userName: "Maria Santos",
      userEmail: "funcionario@edu.br",
      title: "Orientação de Matrícula",
      description: "Atendimento aos calouros para orientação de matrícula e apresentação do campus.",
      date: "2026-03-16",
      startTime: "08:55",
      endTime: "12:30",
      status: "pendente",
      participants: 40,
      recurrence: "none",
      createdAt: "2026-03-09T10:00:00Z",
      updatedAt: "2026-03-09T10:00:00Z",
      color: "#3b82f6",
      history: [
        {
          id: "h-req2-1",
          action: "criada",
          userId: "2",
          userName: "Maria Santos",
          userRole: "Funcionário",
          timestamp: "2026-03-09T10:00:00Z",
          message: "Reserva para período de matrícula dos novos alunos",
        },
      ],
    },
    requestType: "new",
    message: "Necessário para atender os calouros durante o período de matrículas. Esperamos receber cerca de 40 alunos ao longo da manhã.",
    status: "pendente",
    createdAt: "2026-03-09T10:00:00Z",
  },
  {
    id: "req-3",
    booking: {
      id: "new-booking-3",
      roomId: "4",
      userId: "1",
      userName: "Prof. Carlos Silva",
      userEmail: "professor@edu.br",
      title: "Monitoria de Programação",
      description: "Atendimento aos alunos com dúvidas sobre programação e estrutura de dados.",
      date: "2026-03-14",
      startTime: "08:55",
      endTime: "10:35",
      status: "pendente",
      participants: 15,
      recurrence: "weekly",
      recurrenceEndDate: "2026-07-01",
      createdAt: "2026-03-08T10:00:00Z",
      updatedAt: "2026-03-08T10:00:00Z",
      color: "#10b981",
      history: [
        {
          id: "h-req3-1",
          action: "criada",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userRole: "Professor",
          timestamp: "2026-03-08T10:00:00Z",
          message: "Solicitação de reserva recorrente para monitoria semanal",
        },
      ],
    },
    requestType: "new",
    message: "Solicitação de reserva para monitoria semanal. Os monitores precisam de um laboratório para atender os alunos com dúvidas.",
    status: "pendente",
    createdAt: "2026-03-08T10:00:00Z",
  },
  {
    id: "req-4",
    booking: {
      id: "new-booking-4",
      roomId: "5",
      userId: "1",
      userName: "Prof. Carlos Silva",
      userEmail: "professor@edu.br",
      title: "Defesa de TCC - Turma 2026",
      description: "Apresentação dos trabalhos de conclusão de curso dos alunos formandos.",
      date: "2026-03-20",
      startTime: "14:20",
      endTime: "17:05",
      status: "pendente",
      participants: 50,
      recurrence: "none",
      createdAt: "2026-03-10T10:00:00Z",
      updatedAt: "2026-03-10T10:00:00Z",
      color: "#10b981",
      history: [
        {
          id: "h-req4-1",
          action: "criada",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userRole: "Professor",
          timestamp: "2026-03-10T10:00:00Z",
          message: "Reserva do auditório para defesas de TCC",
        },
        {
          id: "h-req4-2",
          action: "comentario",
          userId: "3",
          userName: "Dr. João Oliveira",
          userRole: "Coordenador",
          timestamp: "2026-03-10T14:00:00Z",
          message: "Verificando disponibilidade do auditório e equipamentos de projeção.",
        },
      ],
    },
    requestType: "new",
    message: "Reserva do auditório principal para as defesas de TCC da turma de 2026. Precisaremos de projetor, sistema de som e microfones.",
    status: "pendente",
    createdAt: "2026-03-10T10:00:00Z",
  },
  {
    id: "req-5",
    booking: {
      id: "new-booking-5",
      roomId: "5",
      userId: "3",
      userName: "Dr. João Oliveira",
      userEmail: "coordenador@edu.br",
      title: "Semana Acadêmica de Computação",
      description: "Abertura da Semana Acadêmica de Computação com palestras e workshops.",
      date: "2026-04-15",
      startTime: "19:00",
      endTime: "22:35",
      status: "pendente",
      participants: 200,
      recurrence: "none",
      createdAt: "2026-03-10T10:00:00Z",
      updatedAt: "2026-03-10T10:00:00Z",
      color: "#f59e0b",
      history: [
        {
          id: "h-req5-1",
          action: "criada",
          userId: "3",
          userName: "Dr. João Oliveira",
          userRole: "Coordenador",
          timestamp: "2026-03-10T10:00:00Z",
          message: "Reserva para abertura da Semana Acadêmica",
        },
      ],
    },
    requestType: "new",
    message: "Reserva para a abertura oficial da Semana Acadêmica de Computação. Teremos palestrantes convidados e esperamos 200 participantes.",
    status: "pendente",
    createdAt: "2026-03-10T10:00:00Z",
  },
  {
    id: "req-6",
    booking: {
      id: "swap-booking-1",
      roomId: "2",
      userId: "1",
      userName: "Prof. Carlos Silva",
      userEmail: "professor@edu.br",
      title: "Engenharia de Software I",
      description: "Aula regular - solicito troca de sala por conta de conflito de horário.",
      date: "2026-03-11",
      startTime: "07:00",
      endTime: "08:40",
      status: "pendente",
      participants: 35,
      recurrence: "none",
      createdAt: "2026-03-06T10:00:00Z",
      updatedAt: "2026-03-06T10:00:00Z",
      color: "#10b981",
      history: [
        {
          id: "h-req6-1",
          action: "criada",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userRole: "Professor",
          timestamp: "2026-03-06T10:00:00Z",
          message: "Solicitação de troca de sala para quarta-feira",
        },
      ],
    },
    requestType: "swap",
    originalBookingId: "1",
    swapWithUserId: "2",
    swapWithUserName: "Maria Santos",
    message: "Gostaria de trocar a sala com a Maria na quarta-feira. Ela concordou com a troca por mensagem.",
    status: "pendente",
    createdAt: "2026-03-06T10:00:00Z",
  },
  {
    id: "req-7",
    booking: {
      id: "change-booking-1",
      roomId: "7",
      userId: "1",
      userName: "Prof. Carlos Silva",
      userEmail: "professor@edu.br",
      title: "Estrutura de Dados",
      description: "Solicito alteração de horário da aula.",
      date: "2026-03-12",
      startTime: "15:25",
      endTime: "17:05",
      status: "pendente",
      participants: 42,
      recurrence: "weekly",
      createdAt: "2026-03-07T10:00:00Z",
      updatedAt: "2026-03-07T10:00:00Z",
      color: "#10b981",
      history: [
        {
          id: "h-req7-1",
          action: "criada",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userRole: "Professor",
          timestamp: "2026-03-07T10:00:00Z",
          message: "Solicitação de alteração de horário",
        },
      ],
    },
    requestType: "change",
    originalBookingId: "9",
    message: "Solicito alteração do horário da aula de Estrutura de Dados de 13:30 para 15:25 por motivo de reunião departamental.",
    status: "pendente",
    createdAt: "2026-03-07T10:00:00Z",
  },
  {
    id: "req-8",
    booking: {
      id: "new-booking-6",
      roomId: "5",
      userId: "4",
      userName: "Admin Sistema",
      userEmail: "admin@edu.br",
      title: "Conselho Universitário",
      description: "Reunião extraordinária do conselho universitário.",
      date: "2026-03-18",
      startTime: "14:20",
      endTime: "17:05",
      status: "pendente",
      participants: 30,
      recurrence: "none",
      createdAt: "2026-03-08T10:00:00Z",
      updatedAt: "2026-03-08T10:00:00Z",
      color: "#ef4444",
      history: [
        {
          id: "h-req8-1",
          action: "criada",
          userId: "4",
          userName: "Admin Sistema",
          userRole: "Administrador",
          timestamp: "2026-03-08T10:00:00Z",
          message: "Reserva para reunião do conselho",
        },
      ],
    },
    requestType: "new",
    message: "Reserva do auditório para reunião extraordinária do Conselho Universitário. Pauta: aprovação do calendário acadêmico 2026/2.",
    status: "pendente",
    createdAt: "2026-03-08T10:00:00Z",
  },

  // === SOLICITAÇÕES APROVADAS ===
  {
    id: "req-9",
    booking: {
      id: "approved-booking-1",
      roomId: "2",
      userId: "2",
      userName: "Maria Santos",
      userEmail: "funcionario@edu.br",
      title: "Treinamento de Sistemas",
      description: "Treinamento do novo sistema acadêmico para funcionários.",
      date: "2026-03-10",
      startTime: "08:55",
      endTime: "10:35",
      status: "aprovada",
      participants: 20,
      recurrence: "none",
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-03-02T14:00:00Z",
      approvedBy: "3",
      approvedAt: "2026-03-02T14:00:00Z",
      color: "#3b82f6",
      history: [
        {
          id: "h-req9-1",
          action: "criada",
          userId: "2",
          userName: "Maria Santos",
          userRole: "Funcionário",
          timestamp: "2026-03-01T10:00:00Z",
          message: "Solicitação de treinamento para equipe",
        },
        {
          id: "h-req9-2",
          action: "aprovada",
          userId: "3",
          userName: "Dr. João Oliveira",
          userRole: "Coordenador",
          timestamp: "2026-03-02T14:00:00Z",
          message: "Aprovado. Sala disponível no horário solicitado.",
        },
      ],
    },
    requestType: "new",
    message: "Treinamento obrigatório para todos os funcionários administrativos sobre o novo sistema acadêmico.",
    status: "aprovada",
    createdAt: "2026-03-01T10:00:00Z",
    respondedAt: "2026-03-02T14:00:00Z",
    respondedBy: "3",
    responseMessage: "Aprovado. Sala disponível no horário solicitado.",
  },
  {
    id: "req-10",
    booking: {
      id: "approved-booking-2",
      roomId: "6",
      userId: "2",
      userName: "Maria Santos",
      userEmail: "funcionario@edu.br",
      title: "Reunião de Planejamento",
      description: "Planejamento do calendário acadêmico 2026/2",
      date: "2026-03-11",
      startTime: "14:20",
      endTime: "15:10",
      status: "aprovada",
      participants: 10,
      recurrence: "none",
      createdAt: "2026-03-02T10:00:00Z",
      updatedAt: "2026-03-02T16:00:00Z",
      approvedBy: "4",
      approvedAt: "2026-03-02T16:00:00Z",
      color: "#3b82f6",
      history: [
        {
          id: "h-req10-1",
          action: "criada",
          userId: "2",
          userName: "Maria Santos",
          userRole: "Funcionário",
          timestamp: "2026-03-02T10:00:00Z",
          message: "Reserva para reunião de planejamento",
        },
        {
          id: "h-req10-2",
          action: "aprovada",
          userId: "4",
          userName: "Admin Sistema",
          userRole: "Administrador",
          timestamp: "2026-03-02T16:00:00Z",
          message: "Aprovado pelo administrador.",
        },
      ],
    },
    requestType: "new",
    message: "Reunião com coordenadores para definição do calendário do próximo semestre.",
    status: "aprovada",
    createdAt: "2026-03-02T10:00:00Z",
    respondedAt: "2026-03-02T16:00:00Z",
    respondedBy: "4",
    responseMessage: "Aprovado pelo administrador.",
  },
  {
    id: "req-11",
    booking: {
      id: "approved-booking-3",
      roomId: "5",
      userId: "3",
      userName: "Dr. João Oliveira",
      userEmail: "coordenador@edu.br",
      title: "Palestra: Mercado de TI",
      description: "Palestra sobre tendências e oportunidades no mercado de tecnologia.",
      date: "2026-03-12",
      startTime: "19:00",
      endTime: "20:40",
      status: "aprovada",
      participants: 120,
      recurrence: "none",
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-03-01T15:00:00Z",
      approvedBy: "4",
      approvedAt: "2026-03-01T15:00:00Z",
      color: "#f59e0b",
      history: [
        {
          id: "h-req11-1",
          action: "criada",
          userId: "3",
          userName: "Dr. João Oliveira",
          userRole: "Coordenador",
          timestamp: "2026-03-01T10:00:00Z",
          message: "Solicitação de palestra com convidado externo",
        },
        {
          id: "h-req11-2",
          action: "aprovada",
          userId: "4",
          userName: "Admin Sistema",
          userRole: "Administrador",
          timestamp: "2026-03-01T15:00:00Z",
          message: "Aprovado. Auditório reservado com todos os equipamentos.",
        },
      ],
    },
    requestType: "new",
    message: "Palestra com profissional convidado do mercado para falar sobre carreiras em TI.",
    status: "aprovada",
    createdAt: "2026-03-01T10:00:00Z",
    respondedAt: "2026-03-01T15:00:00Z",
    respondedBy: "4",
    responseMessage: "Aprovado. Auditório reservado com todos os equipamentos.",
  },

  // === SOLICITAÇÕES REJEITADAS ===
  {
    id: "req-12",
    booking: {
      id: "rejected-booking-1",
      roomId: "3",
      userId: "2",
      userName: "Maria Santos",
      userEmail: "funcionario@edu.br",
      title: "Workshop de Informática",
      description: "Workshop básico de informática para terceira idade.",
      date: "2026-03-08",
      startTime: "13:30",
      endTime: "15:10",
      status: "rejeitada",
      participants: 20,
      recurrence: "none",
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-03-03T10:00:00Z",
      rejectionReason: "Laboratório já reservado para manutenção preventiva",
      color: "#3b82f6",
      history: [
        {
          id: "h-req12-1",
          action: "criada",
          userId: "2",
          userName: "Maria Santos",
          userRole: "Funcionário",
          timestamp: "2026-03-01T10:00:00Z",
          message: "Solicitação de reserva para workshop de inclusão digital",
        },
        {
          id: "h-req12-2",
          action: "comentario",
          userId: "4",
          userName: "Admin Sistema",
          userRole: "Administrador",
          timestamp: "2026-03-02T09:00:00Z",
          message: "Verificando disponibilidade do laboratório...",
        },
        {
          id: "h-req12-3",
          action: "rejeitada",
          userId: "3",
          userName: "Dr. João Oliveira",
          userRole: "Coordenador",
          timestamp: "2026-03-03T10:00:00Z",
          message: "Infelizmente o laboratório estará em manutenção nessa data. Sugiro reagendar para a semana seguinte.",
        },
      ],
    },
    requestType: "new",
    message: "Workshop de inclusão digital para idosos da comunidade. Parceria com a prefeitura.",
    status: "rejeitada",
    createdAt: "2026-03-01T10:00:00Z",
    respondedAt: "2026-03-03T10:00:00Z",
    respondedBy: "3",
    responseMessage: "Infelizmente o laboratório estará em manutenção nessa data. Sugiro reagendar para a semana seguinte.",
  },
  {
    id: "req-13",
    booking: {
      id: "rejected-booking-2",
      roomId: "5",
      userId: "1",
      userName: "Prof. Carlos Silva",
      userEmail: "professor@edu.br",
      title: "Aula Extra de Revisão",
      description: "Revisão para prova de programação.",
      date: "2026-03-08",
      startTime: "19:00",
      endTime: "20:40",
      status: "rejeitada",
      participants: 60,
      recurrence: "none",
      createdAt: "2026-03-04T10:00:00Z",
      updatedAt: "2026-03-05T09:00:00Z",
      rejectionReason: "Auditório já reservado para evento institucional",
      color: "#10b981",
      history: [
        {
          id: "h-req13-1",
          action: "criada",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userRole: "Professor",
          timestamp: "2026-03-04T10:00:00Z",
          message: "Solicitação de aula extra antes da prova",
        },
        {
          id: "h-req13-2",
          action: "rejeitada",
          userId: "4",
          userName: "Admin Sistema",
          userRole: "Administrador",
          timestamp: "2026-03-05T09:00:00Z",
          message: "O auditório já está reservado para um evento institucional. Sugerimos usar a Sala 201 que comporta até 45 alunos.",
        },
      ],
    },
    requestType: "new",
    message: "Aula de revisão para a prova bimestral. Muitos alunos solicitaram.",
    status: "rejeitada",
    createdAt: "2026-03-04T10:00:00Z",
    respondedAt: "2026-03-05T09:00:00Z",
    respondedBy: "4",
    responseMessage: "O auditório já está reservado para um evento institucional. Sugerimos usar a Sala 201 que comporta até 45 alunos.",
  },
  {
    id: "req-14",
    booking: {
      id: "cancel-booking-1",
      roomId: "6",
      userId: "3",
      userName: "Dr. João Oliveira",
      userEmail: "coordenador@edu.br",
      title: "Reunião de Colegiado",
      description: "Reunião mensal do colegiado do curso - CANCELADA.",
      date: "2026-03-03",
      startTime: "15:25",
      endTime: "17:05",
      status: "cancelada",
      participants: 12,
      recurrence: "none",
      createdAt: "2026-02-25T10:00:00Z",
      updatedAt: "2026-03-02T08:00:00Z",
      color: "#f59e0b",
      history: [
        {
          id: "h-req14-1",
          action: "criada",
          userId: "3",
          userName: "Dr. João Oliveira",
          userRole: "Coordenador",
          timestamp: "2026-02-25T10:00:00Z",
          message: "Reserva para reunião mensal",
        },
        {
          id: "h-req14-2",
          action: "aprovada",
          userId: "4",
          userName: "Admin Sistema",
          userRole: "Administrador",
          timestamp: "2026-02-25T14:00:00Z",
          message: "Aprovado.",
        },
        {
          id: "h-req14-3",
          action: "cancelada",
          userId: "3",
          userName: "Dr. João Oliveira",
          userRole: "Coordenador",
          timestamp: "2026-03-02T08:00:00Z",
          message: "Cancelamento solicitado por falta de quórum.",
        },
      ],
    },
    requestType: "cancel",
    originalBookingId: "18",
    message: "Solicito cancelamento da reunião por falta de quórum. Vários membros estão em viagem para congresso.",
    status: "aprovada",
    createdAt: "2026-03-02T08:00:00Z",
    respondedAt: "2026-03-02T09:00:00Z",
    respondedBy: "4",
    responseMessage: "Cancelamento aprovado. Sala liberada.",
  },
]

// Sessões de edição de grade de exemplo
export const initialEditSessions: EditSession[] = [
  {
    id: "session-1",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    userRole: "Professor",
    title: "Ajustes de horários - Semana 11/03",
    description: "Reorganização dos horários de aula devido a conflito com reunião departamental",
    status: "pendente",
    createdAt: "2026-03-09T14:30:00Z",
    updatedAt: "2026-03-09T14:30:00Z",
    actions: [
      {
        id: "action-1-1",
        type: "edit",
        description: "Alteração de horário: Engenharia de Software I de 07:00 para 08:55",
        status: "pendente",
        booking: {
          id: "edit-1",
          roomId: "1",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Engenharia de Software I",
          description: "Aula movida por conflito de horário",
          date: "2026-03-11",
          startTime: "08:55",
          endTime: "10:35",
          status: "pendente",
          participants: 35,
          recurrence: "none",
          createdAt: "2026-03-09T14:30:00Z",
          updatedAt: "2026-03-09T14:30:00Z",
          color: "#10b981",
        },
        originalBooking: {
          id: "1",
          roomId: "1",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Engenharia de Software I",
          date: "2026-03-11",
          startTime: "07:00",
          endTime: "08:40",
          status: "aprovada",
          participants: 35,
          recurrence: "weekly",
          createdAt: "2026-02-01T10:00:00Z",
          updatedAt: "2026-02-01T10:00:00Z",
          color: "#10b981",
        },
      },
      {
        id: "action-1-2",
        type: "add",
        description: "Nova aula de reposição: Estrutura de Dados - Sábado",
        status: "pendente",
        booking: {
          id: "edit-2",
          roomId: "7",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Estrutura de Dados - Reposição",
          description: "Aula de reposição do feriado",
          date: "2026-03-14",
          startTime: "08:00",
          endTime: "11:40",
          status: "pendente",
          participants: 42,
          recurrence: "none",
          createdAt: "2026-03-09T14:30:00Z",
          updatedAt: "2026-03-09T14:30:00Z",
          color: "#10b981",
        },
      },
      {
        id: "action-1-3",
        type: "swap",
        description: "Troca de sala com Prof. Maria: Lab 1 <-> Sala 102",
        status: "pendente",
        booking: {
          id: "edit-3",
          roomId: "2",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Laboratório de Programação",
          description: "Movido para Sala 102 por troca",
          date: "2026-03-10",
          startTime: "10:50",
          endTime: "12:30",
          status: "pendente",
          participants: 28,
          recurrence: "none",
          createdAt: "2026-03-09T14:30:00Z",
          updatedAt: "2026-03-09T14:30:00Z",
          color: "#10b981",
        },
        swapTarget: {
          id: "swap-target-1",
          roomId: "3",
          userId: "2",
          userName: "Maria Santos",
          userEmail: "funcionario@edu.br",
          title: "Treinamento TI",
          description: "Movido para Lab 1 por troca",
          date: "2026-03-10",
          startTime: "10:50",
          endTime: "12:30",
          status: "pendente",
          participants: 20,
          recurrence: "none",
          createdAt: "2026-03-09T14:30:00Z",
          updatedAt: "2026-03-09T14:30:00Z",
          color: "#3b82f6",
        },
      },
    ],
  },
  {
    id: "session-2",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userEmail: "professor@edu.br",
    userRole: "Professor",
    title: "Reorganização do semestre",
    description: "Ajustes necessários para acomodar novo horário de monitoria",
    status: "parcial",
    createdAt: "2026-03-07T10:00:00Z",
    updatedAt: "2026-03-08T14:00:00Z",
    respondedBy: "3",
    actions: [
      {
        id: "action-2-1",
        type: "add",
        description: "Nova monitoria de Programação às terças",
        status: "aprovada",
        respondedAt: "2026-03-08T14:00:00Z",
        respondedBy: "3",
        responseMessage: "Aprovado. Horário disponível.",
        booking: {
          id: "edit-4",
          roomId: "3",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Monitoria de Programação",
          description: "Horário de atendimento aos alunos",
          date: "2026-03-11",
          startTime: "14:20",
          endTime: "15:10",
          status: "aprovada",
          participants: 15,
          recurrence: "weekly",
          createdAt: "2026-03-07T10:00:00Z",
          updatedAt: "2026-03-08T14:00:00Z",
          color: "#10b981",
        },
      },
      {
        id: "action-2-2",
        type: "edit",
        description: "Alteração de sala: BD II da Sala 101 para Lab 2",
        status: "rejeitada",
        respondedAt: "2026-03-08T14:05:00Z",
        respondedBy: "3",
        responseMessage: "Lab 2 já está reservado neste horário para manutenção.",
        booking: {
          id: "edit-5",
          roomId: "4",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Banco de Dados II",
          description: "Mudança para laboratório",
          date: "2026-03-12",
          startTime: "13:30",
          endTime: "15:10",
          status: "rejeitada",
          participants: 38,
          recurrence: "weekly",
          createdAt: "2026-03-07T10:00:00Z",
          updatedAt: "2026-03-08T14:05:00Z",
          color: "#10b981",
        },
        originalBooking: {
          id: "orig-5",
          roomId: "1",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Banco de Dados II",
          date: "2026-03-12",
          startTime: "13:30",
          endTime: "15:10",
          status: "aprovada",
          participants: 38,
          recurrence: "weekly",
          createdAt: "2026-02-01T10:00:00Z",
          updatedAt: "2026-02-01T10:00:00Z",
          color: "#10b981",
        },
      },
      {
        id: "action-2-3",
        type: "remove",
        description: "Cancelamento: Aula extra de revisão",
        status: "pendente",
        booking: {
          id: "edit-6",
          roomId: "1",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Aula Extra - Revisão para P1",
          description: "Cancelada por baixa adesão",
          date: "2026-03-15",
          startTime: "08:00",
          endTime: "09:45",
          status: "pendente",
          participants: 10,
          recurrence: "none",
          createdAt: "2026-03-07T10:00:00Z",
          updatedAt: "2026-03-07T10:00:00Z",
          color: "#10b981",
        },
      },
    ],
  },
  {
    id: "session-3",
    userId: "2",
    userName: "Maria Santos",
    userEmail: "funcionario@edu.br",
    userRole: "Funcionário",
    title: "Eventos do setor administrativo",
    description: "Reservas para treinamentos e reuniões do próximo mês",
    status: "pendente",
    createdAt: "2026-03-10T09:00:00Z",
    updatedAt: "2026-03-10T09:00:00Z",
    actions: [
      {
        id: "action-3-1",
        type: "add",
        description: "Treinamento: Novo sistema financeiro",
        status: "pendente",
        booking: {
          id: "edit-7",
          roomId: "4",
          userId: "2",
          userName: "Maria Santos",
          userEmail: "funcionario@edu.br",
          title: "Treinamento Sistema Financeiro",
          description: "Capacitação para equipe financeira",
          date: "2026-03-17",
          startTime: "08:55",
          endTime: "12:30",
          status: "pendente",
          participants: 15,
          recurrence: "none",
          createdAt: "2026-03-10T09:00:00Z",
          updatedAt: "2026-03-10T09:00:00Z",
          color: "#3b82f6",
        },
      },
      {
        id: "action-3-2",
        type: "add",
        description: "Reunião: Planejamento semestral",
        status: "pendente",
        booking: {
          id: "edit-8",
          roomId: "6",
          userId: "2",
          userName: "Maria Santos",
          userEmail: "funcionario@edu.br",
          title: "Reunião de Planejamento",
          description: "Planejamento das atividades do semestre",
          date: "2026-03-18",
          startTime: "14:20",
          endTime: "17:05",
          status: "pendente",
          participants: 12,
          recurrence: "none",
          createdAt: "2026-03-10T09:00:00Z",
          updatedAt: "2026-03-10T09:00:00Z",
          color: "#3b82f6",
        },
      },
      {
        id: "action-3-3",
        type: "add",
        description: "Workshop: Atendimento ao público",
        status: "pendente",
        booking: {
          id: "edit-9",
          roomId: "2",
          userId: "2",
          userName: "Maria Santos",
          userEmail: "funcionario@edu.br",
          title: "Workshop Atendimento",
          description: "Capacitação em atendimento ao público",
          date: "2026-03-19",
          startTime: "08:55",
          endTime: "12:30",
          status: "pendente",
          participants: 25,
          recurrence: "none",
          createdAt: "2026-03-10T09:00:00Z",
          updatedAt: "2026-03-10T09:00:00Z",
          color: "#3b82f6",
        },
      },
      {
        id: "action-3-4",
        type: "add",
        description: "Treinamento: Protocolo digital",
        status: "pendente",
        booking: {
          id: "edit-10",
          roomId: "4",
          userId: "2",
          userName: "Maria Santos",
          userEmail: "funcionario@edu.br",
          title: "Treinamento Protocolo Digital",
          description: "Uso do novo sistema de protocolo",
          date: "2026-03-20",
          startTime: "13:30",
          endTime: "17:05",
          status: "pendente",
          participants: 20,
          recurrence: "none",
          createdAt: "2026-03-10T09:00:00Z",
          updatedAt: "2026-03-10T09:00:00Z",
          color: "#3b82f6",
        },
      },
    ],
  },
  {
    id: "session-4",
    userId: "3",
    userName: "Dr. João Oliveira",
    userEmail: "coordenador@edu.br",
    userRole: "Coordenador",
    title: "Grade do novo semestre 2026/2",
    description: "Configuração inicial da grade de horários para o segundo semestre",
    status: "aprovada",
    createdAt: "2026-02-15T10:00:00Z",
    updatedAt: "2026-02-16T14:00:00Z",
    respondedAt: "2026-02-16T14:00:00Z",
    respondedBy: "4",
    responseMessage: "Grade aprovada. Todas as alocações estão corretas.",
    actions: [
      {
        id: "action-4-1",
        type: "add",
        description: "Alocação: Inteligência Artificial - Dr. João",
        status: "aprovada",
        respondedAt: "2026-02-16T14:00:00Z",
        respondedBy: "4",
        booking: {
          id: "grade-1",
          roomId: "7",
          userId: "3",
          userName: "Dr. João Oliveira",
          userEmail: "coordenador@edu.br",
          title: "Inteligência Artificial",
          description: "Disciplina obrigatória 8º período",
          date: "2026-03-09",
          startTime: "19:00",
          endTime: "20:40",
          status: "aprovada",
          participants: 45,
          recurrence: "weekly",
          createdAt: "2026-02-15T10:00:00Z",
          updatedAt: "2026-02-16T14:00:00Z",
          color: "#f59e0b",
        },
      },
      {
        id: "action-4-2",
        type: "add",
        description: "Alocação: Banco de Dados II - Dr. João",
        status: "aprovada",
        respondedAt: "2026-02-16T14:00:00Z",
        respondedBy: "4",
        booking: {
          id: "grade-2",
          roomId: "1",
          userId: "3",
          userName: "Dr. João Oliveira",
          userEmail: "coordenador@edu.br",
          title: "Banco de Dados II",
          description: "Disciplina obrigatória 5º período",
          date: "2026-03-11",
          startTime: "13:30",
          endTime: "15:10",
          status: "aprovada",
          participants: 38,
          recurrence: "weekly",
          createdAt: "2026-02-15T10:00:00Z",
          updatedAt: "2026-02-16T14:00:00Z",
          color: "#f59e0b",
        },
      },
      {
        id: "action-4-3",
        type: "add",
        description: "Alocação: Engenharia de Software I - Prof. Carlos",
        status: "aprovada",
        respondedAt: "2026-02-16T14:00:00Z",
        respondedBy: "4",
        booking: {
          id: "grade-3",
          roomId: "1",
          userId: "1",
          userName: "Prof. Carlos Silva",
          userEmail: "professor@edu.br",
          title: "Engenharia de Software I",
          description: "Disciplina obrigatória 6º período",
          date: "2026-03-09",
          startTime: "07:00",
          endTime: "08:40",
          status: "aprovada",
          participants: 35,
          recurrence: "weekly",
          createdAt: "2026-02-15T10:00:00Z",
          updatedAt: "2026-02-16T14:00:00Z",
          color: "#10b981",
        },
      },
    ],
  },
]

// Helper para gerar ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Helper para obter cor baseada no usuário
export function getUserColor(userId: string): string {
  const index = parseInt(userId, 10) % bookingColors.length
  return bookingColors[index] || bookingColors[0]
}

// Helper para formatar data
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
}

// Helper para obter nome do tipo de sala
export function getRoomTypeName(type: RoomType): string {
  const names: Record<RoomType, string> = {
    sala_aula: "Sala de Aula",
    laboratorio: "Laboratório",
    auditorio: "Auditório",
    sala_reuniao: "Sala de Reunião",
  }
  return names[type]
}

// Helper para obter nome do status
export function getStatusName(status: BookingStatus): string {
  const names: Record<BookingStatus, string> = {
    pendente: "Pendente",
    aprovada: "Aprovada",
    rejeitada: "Rejeitada",
    cancelada: "Cancelada",
    em_andamento: "Em Andamento",
    concluida: "Concluída",
  }
  return names[status]
}

// Helper para obter cor do status
export function getStatusColor(status: BookingStatus | "parcial"): string {
  const colors: Record<BookingStatus | "parcial", string> = {
    pendente: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    aprovada: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    rejeitada: "bg-red-500/20 text-red-600 border-red-500/30",
    cancelada: "bg-gray-500/20 text-gray-600 border-gray-500/30",
    em_andamento: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    concluida: "bg-gray-500/20 text-gray-600 border-gray-500/30",
    parcial: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  }
  return colors[status]
}

// Helper para obter nome do status de sessão
export function getSessionStatusName(status: EditSession["status"]): string {
  const names: Record<EditSession["status"], string> = {
    pendente: "Pendente",
    parcial: "Parcialmente Aprovada",
    aprovada: "Aprovada",
    rejeitada: "Rejeitada",
  }
  return names[status]
}

// Helper para obter nome do tipo de ação
export function getActionTypeName(type: EditSessionAction["type"]): string {
  const names: Record<EditSessionAction["type"], string> = {
    add: "Nova Reserva",
    edit: "Alteração",
    swap: "Troca",
    remove: "Remoção",
  }
  return names[type]
}

// Helper para obter cor do tipo de ação
export function getActionTypeColor(type: EditSessionAction["type"]): string {
  const colors: Record<EditSessionAction["type"], string> = {
    add: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    edit: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    swap: "bg-purple-500/20 text-purple-600 border-purple-500/30",
    remove: "bg-red-500/20 text-red-600 border-red-500/30",
  }
  return colors[type]
}
