import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

interface User {
  name: string
}

function Home() {
  const users: User[] = [
    { name: "João Oliveira"},
    { name: "Miguel Neto"},
    { name: "Emanuel Gomes"}
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Stackr Web App</h1>
      <div>
        <h2>Utilizadores:</h2>
        {users.map((user, index) => (
          <p key={index}>
            Nome: {user.name}
          </p>
        ))}
      </div>
    </div>
  )
}
