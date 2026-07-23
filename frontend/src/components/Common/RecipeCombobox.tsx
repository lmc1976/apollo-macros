import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { RecipesService } from "@/client"
import { Input } from "@/components/ui/input"

export interface RecipeOption {
  id: string
  name: string
}

interface RecipeComboboxProps {
  value: RecipeOption | null
  onChange: (recipe: RecipeOption) => void
  placeholder?: string
}

export function RecipeCombobox({
  value,
  onChange,
  placeholder,
}: RecipeComboboxProps) {
  const [query, setQuery] = useState(value?.name ?? "")
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timeout)
  }, [query])

  const { data } = useQuery({
    queryKey: ["recipes-search", debouncedQuery],
    queryFn: () =>
      RecipesService.readRecipes({ q: debouncedQuery || undefined, limit: 20 }),
    enabled: open,
  })
  const results = data?.data ?? []

  return (
    <div className="relative">
      <Input
        type="text"
        autoComplete="off"
        placeholder={placeholder ?? "Buscar receita..."}
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
              Nenhuma receita encontrada
            </div>
          ) : (
            results.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                className="hover:bg-accent hover:text-accent-foreground block w-full px-3 py-2 text-left text-sm"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange({ id: recipe.id, name: recipe.name })
                  setQuery(recipe.name)
                  setOpen(false)
                }}
              >
                {recipe.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
