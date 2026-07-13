# 🜁 Phoenix OS — README v2.5

> **Sistema Operacional Pessoal de Evolução**
> Um app React que organiza a vida inteira em módulos integrados, com XP, personas, analytics e persistência local.

---

## O que é o Phoenix OS

Phoenix OS não é um app de tarefas. Não é um app de hábitos.
É uma representação digital da sua vida — organizada por **Personas** que definem contexto, cor, foco e XP.

Cada ação em qualquer módulo gera XP que alimenta um **Radar RPG** de 6 eixos de evolução pessoal.

```
Pessoa → Persona Ativa → Módulos → Ações → XP → Radar de Evolução
```

---

## Stack Tecnológica

| Camada        | Tecnologia                                   |
| ------------- | -------------------------------------------- |
| Framework     | React (CRA)                                  |
| Roteamento    | React Router DOM                             |
| Estado global | Zustand + persist middleware                 |
| Persistência  | LocalStorage (Firebase preparado)            |
| Estilo        | Tailwind v3 + CSS vars dinâmicas por persona |
| Animações     | Framer Motion                                |
| Gráficos      | Recharts                                     |
| Notificações  | React Hot Toast                              |
| Formulários   | React Hook Form                              |
| Utilitários   | clsx, date-fns                               |
