import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { FoodsService } from "@/client"
import { Input } from "@/components/ui/input"

export interface FoodOption {
  id: string
  name: string
}

interface FoodComboboxProps {
  value: FoodOption | null
  onChange: (food: FoodOption) => void
  placeholder?: string
}

export function FoodCombobox({
  value,
  onChange,
  placeholder,
}: FoodComboboxProps) {
  const [query, setQuery] = useState(value?.name ?? "")
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timeout)
  }, [query])

  const { data } = useQuery({
    queryKey: ["foods-search", debouncedQuery],
    queryFn: () =>
      FoodsService.readFoods({ q: debouncedQuery || undefined, limit: 20 }),
    enabled: open,
  })
  const results = data?.data ?? []

  return (
    <div className="relative">
      <Input
        type="text"
        autoComplete="off"
        placeholder={placeholder ?? "Buscar alimento..."}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
      />
      {open && (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-md">
          {results.length === 0 ? (
            <div className="text-muted-foreground px-3 py-2 text-sm">
              Nenhum alimento encontrado
            </div>
          ) : (
            results.map((food) => (
              <button
                key={food.id}
                type="button"
                className="hover:bg-accent hover:text-accent-foreground block w-full px-3 py-2 text-left text-sm"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange({ id: food.id, name: food.name })
                  setQuery(food.name)
                  setOpen(false)
                }}
              >
                {food.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
