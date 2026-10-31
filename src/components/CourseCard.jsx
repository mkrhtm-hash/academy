import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Clock, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fmtMinutes, person } from '../data/content.js'
import { compact } from '../lib/utils.js'
import CourseThumb from './CourseThumb.jsx'
import { Avatar, LevelBadge } from './ui.jsx'

export default function CourseCard({ course, index = 0, ref }) {
  const prog = course.progress
  const started = prog && prog.done > 0
  const ins = person(course.instructor_name)

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link to={`/courses/${course.slug}`} className="glass card-hover group flex h-full flex-col overflow-hidden rounded-3xl">
        <div className="relative">
          <CourseThumb course={course} className="h-40 transition-transform duration-500 group-hover:scale-[1.04]" />
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur">{course.category}</span>
          </div>
          <div className="absolute right-4 top-4">
            {course.is_free
              ? <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-950">FREE</span>
              : <span className="rounded-full bg-black/55 px-2.5 py-1 text-[0.7rem] font-semibold text-gold backdrop-blur">PRO</span>}
          </div>
          {started && (
            <div className="absolute bottom-3 left-4 right-4">
              <div className="mb-1 flex justify-between text-[0.7rem] font-medium text-white/90">
                <span className="flex items-center gap-1">{prog.pct === 100 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}{prog.pct === 100 ? 'Completed' : 'In progress'}</span>
                <span className="num">{prog.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-brand" style={{ width: `${prog.pct}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2">
            <LevelBadge level={course.level} />
            <span className="text-xs text-muted">{course.modules_count} modules</span>
          </div>
          <h3 className="text-lg font-semibold leading-snug transition-colors group-hover:text-emerald-400">{course.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{course.subtitle}</p>

          <div className="mt-auto pt-5">
            <div className="flex items-center gap-2.5">
              <Avatar initials={ins.initials} hue={ins.hue} size={28} />
              <span className="text-sm font-medium">{ins.name}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{fmtMinutes(course.duration_minutes)}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{course.lessons_count} lessons</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{compact(course.students)} {course.students === 1 ? 'student' : 'students'}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
