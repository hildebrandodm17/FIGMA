import { type ReactNode } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Transition show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] p-6 shadow-xl">
                {title && (
                  <div className="flex items-center justify-between mb-4">
                    <DialogTitle className="text-lg font-semibold text-[#F5F5F5]">
                      {title}
                    </DialogTitle>
                    <button
                      onClick={onClose}
                      className="text-[#9CA3AF] hover:text-[#F5F5F5] transition-colors rounded-lg p-1 hover:bg-[#2A2A2A]"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2A2A2A]', className)}>
      {children}
    </div>
  )
}
