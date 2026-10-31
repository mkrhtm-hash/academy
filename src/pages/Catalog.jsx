import { AnimatePresence } from 'framer-motion'
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CourseCard from '../components/CourseCard.jsx'
import { CardSkeleton, EmptyState, ErrorState, Page, PageHeader } from '../components/ui.jsx'
import { CATEGORIES, LEVELS } from '../data/content.js'
import { useApi } from '../lib/api.js'

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || 'All')
  const [level, setLevel] = useState(params.get('level') || 'All')
  const [sort, setSort] = useState('popular')
  const [price, setPrice] = useState('all')

  useEffect(() => {
    const p = {}
    if (query) p.q = query
    if (category !== 'All') p.category = category
    if (level !== 'All') p.level = level
    setParams(p, { replace: true })
  }, [query, category, level, setParams])

  // Category and level are filtered by the database; search, price and sort happen here.
  const qs = new URLSearchParams({ ...(category !== 'All' && { category }), ...(level !== 'All' && { level }) }).toString()
  const { data, error, loading, reload } = useApi(`/courses${qs ? `?${qs}` : ''}`)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (data?.courses || []).filter((c) =>
      (price === 'all' || (price === 'free' ? c.is_free : !c.is_free)) &&
      (!q || [c.title, c.subtitle, c.category, c.instructor_name].some((s) => s.toLowerCase().includes(q))),
    )
    const sorters = {
      popular: (a, b) => b.students - a.students || a.id - b.id,
      newest: (a, b) => b.id - a.id,
      shortest: (a, b) => a.duration_minutes - b.duration_minutes,
    }
    return [...list].sort(sorters[sort])
  }, [data, query, sort, price])

  const clear = () => { setQuery(''); setCategory('All'); setLevel('All'); setPrice('all') }
  const filtered = query || category !== 'All' || level !== 'All' || price !== 'all'

  return (
    <Page>
      <PageHeader eyebrow="Course catalog" title="Find your next edge" subtitle="Expert-led courses across forex, gold, indices and crypto, plus the risk and psychology skills that hold it all together." />

      <div className="glass sticky top-[4.5rem] z-20 mb-8 rounded-3xl p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses, topics or instructors…" className="input !pl-10" aria-label="Search courses" />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="grid grid-cols-4 rounded-xl border border-line bg-soft p-1 sm:flex">
              {['All', ...LEVELS].map((l) => (
                <button key={l} onClick={() => setLevel(l)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition sm:px-3 ${level === l ? 'bg-panel-solid text-ink shadow' : 'text-muted hover:text-ink'}`}>{l === 'Intermediate' ? <><span className="sm:hidden">Inter.</span><span className="hidden sm:inline">{l}</span></> : l}</button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input sm:!w-auto" aria-label="Sort by">
              <option value="popular">Most popular</option>
              <option value="newest">Newest</option>
              <option value="shortest">Shortest first</option>
            </select>
          </div>
        </div>
        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`chip ${category === c ? 'chip-active' : ''}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between text-sm">
        <span className="text-muted"><span className="num font-semibold text-ink">{results.length}</span> course{results.length !== 1 && 's'} found</span>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted" />
          {['all', 'free', 'pro'].map((p) => (
            <button key={p} onClick={() => setPrice(p)} className={`text-xs font-semibold capitalize ${price === p ? 'text-emerald-400' : 'text-muted hover:text-ink'}`}>{p}</button>
          ))}
          {filtered && <button onClick={clear} className="ml-2 text-xs font-semibold text-gold hover:underline">Clear all</button>}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : results.length === 0 ? (
        <EmptyState icon={SearchX} title="No courses match those filters" message="Try a different keyword or broaden the level and category filters." action={<button onClick={clear} className="btn btn-primary">Clear filters</button>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {results.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
          </AnimatePresence>
        </div>
      )}
    </Page>
  )
}
