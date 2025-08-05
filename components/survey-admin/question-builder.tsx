'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  MoveUp, 
  MoveDown,
  Copy,
  Settings
} from 'lucide-react'

interface Question {
  id?: string
  question_text: string
  question_type: 'multiple_choice' | 'text' | 'rating' | 'checkbox' | 'yes_no' | 'date_time'
  question_order: number
  is_required: boolean
  options?: string[]
  validation_rules?: {
    min_length?: number
    max_length?: number
    min_selections?: number
    max_selections?: number
    min_value?: number
    max_value?: number
  }
}

interface QuestionBuilderProps {
  questions: Question[]
  onQuestionsChange: (questions: Question[]) => void
  surveyId?: string
}

export function QuestionBuilder({ questions, onQuestionsChange, surveyId }: QuestionBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      question_type: 'multiple_choice',
      question_order: questions.length + 1,
      is_required: false,
      options: ['Option 1', 'Option 2'],
      validation_rules: {}
    }
    onQuestionsChange([...questions, newQuestion])
    setEditingQuestion(newQuestion)
    setShowAddForm(true)
  }

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions]
    newQuestions[index] = updatedQuestion
    onQuestionsChange(newQuestions)
  }

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index)
    // Reorder remaining questions
    newQuestions.forEach((q, i) => {
      q.question_order = i + 1
    })
    onQuestionsChange(newQuestions)
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return
    }

    const newQuestions = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap questions using temporary variable
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[targetIndex]
    newQuestions[targetIndex] = temp
    
    // Update order
    newQuestions[index].question_order = index + 1
    newQuestions[targetIndex].question_order = targetIndex + 1
    
    onQuestionsChange(newQuestions)
  }

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index]
    const newQuestion: Question = {
      ...questionToDuplicate,
      question_text: `${questionToDuplicate.question_text} (Copy)`,
      question_order: questions.length + 1
    }
    onQuestionsChange([...questions, newQuestion])
  }

  const getQuestionTypeLabel = (type: string) => {
    const labels = {
      multiple_choice: 'Multiple Choice',
      text: 'Text Input',
      rating: 'Rating Scale',
      checkbox: 'Checkbox',
      yes_no: 'Yes/No',
      date_time: 'Date/Time'
    }
    return labels[type as keyof typeof labels] || type
  }

  const renderQuestionForm = (question: Question, index: number) => {
    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-lg">Question {question.question_order}</CardTitle>
              <Badge variant="outline">{getQuestionTypeLabel(question.question_type)}</Badge>
              {question.is_required && <Badge variant="destructive">Required</Badge>}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveQuestion(index, 'up')}
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveQuestion(index, 'down')}
                disabled={index === questions.length - 1}
              >
                <MoveDown className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => duplicateQuestion(index)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteQuestion(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Text */}
          <div>
            <Label htmlFor={`question-text-${index}`}>Question Text</Label>
            <Textarea
              id={`question-text-${index}`}
              value={question.question_text}
              onChange={(e) => updateQuestion(index, { ...question, question_text: e.target.value })}
              placeholder="Enter your question here..."
              className="mt-1"
            />
          </div>

          {/* Question Type */}
          <div>
            <Label htmlFor={`question-type-${index}`}>Question Type</Label>
            <Select
              value={question.question_type}
              onValueChange={(value) => updateQuestion(index, { 
                ...question, 
                question_type: value as Question['question_type'],
                options: value === 'multiple_choice' || value === 'checkbox' ? ['Option 1', 'Option 2'] : undefined
              })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="rating">Rating Scale</SelectItem>
                <SelectItem value="yes_no">Yes/No</SelectItem>
                <SelectItem value="date_time">Date/Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options for multiple choice and checkbox */}
          {(question.question_type === 'multiple_choice' || question.question_type === 'checkbox') && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2 mt-1">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])]
                        newOptions[optionIndex] = e.target.value
                        updateQuestion(index, { ...question, options: newOptions })
                      }}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newOptions = question.options?.filter((_, i) => i !== optionIndex)
                        updateQuestion(index, { ...question, options: newOptions })
                      }}
                      disabled={(question.options?.length || 0) <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`]
                    updateQuestion(index, { ...question, options: newOptions })
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {/* Validation Rules */}
          <div>
            <Label>Validation Rules</Label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              {question.question_type === 'text' && (
                <>
                  <div>
                    <Label htmlFor={`min-length-${index}`}>Min Length</Label>
                    <Input
                      id={`min-length-${index}`}
                      type="number"
                      value={question.validation_rules?.min_length || ''}
                      onChange={(e) => updateQuestion(index, {
                        ...question,
                        validation_rules: {
                          ...question.validation_rules,
                          min_length: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`max-length-${index}`}>Max Length</Label>
                    <Input
                      id={`max-length-${index}`}
                      type="number"
                      value={question.validation_rules?.max_length || ''}
                      onChange={(e) => updateQuestion(index, {
                        ...question,
                        validation_rules: {
                          ...question.validation_rules,
                          max_length: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                </>
              )}
              {question.question_type === 'checkbox' && (
                <>
                  <div>
                    <Label htmlFor={`min-selections-${index}`}>Min Selections</Label>
                    <Input
                      id={`min-selections-${index}`}
                      type="number"
                      value={question.validation_rules?.min_selections || ''}
                      onChange={(e) => updateQuestion(index, {
                        ...question,
                        validation_rules: {
                          ...question.validation_rules,
                          min_selections: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`max-selections-${index}`}>Max Selections</Label>
                    <Input
                      id={`max-selections-${index}`}
                      type="number"
                      value={question.validation_rules?.max_selections || ''}
                      onChange={(e) => updateQuestion(index, {
                        ...question,
                        validation_rules: {
                          ...question.validation_rules,
                          max_selections: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                </>
              )}
              {question.question_type === 'rating' && (
                <>
                  <div>
                    <Label htmlFor={`min-value-${index}`}>Min Value</Label>
                    <Input
                      id={`min-value-${index}`}
                      type="number"
                      value={question.validation_rules?.min_value || ''}
                      onChange={(e) => updateQuestion(index, {
                        ...question,
                        validation_rules: {
                          ...question.validation_rules,
                          min_value: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`max-value-${index}`}>Max Value</Label>
                    <Input
                      id={`max-value-${index}`}
                      type="number"
                      value={question.validation_rules?.max_value || ''}
                      onChange={(e) => updateQuestion(index, {
                        ...question,
                        validation_rules: {
                          ...question.validation_rules,
                          max_value: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Required Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`required-${index}`}
              checked={question.is_required}
              onCheckedChange={(checked) => updateQuestion(index, { ...question, is_required: !!checked })}
            />
            <Label htmlFor={`required-${index}`}>Required question</Label>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Survey Questions</h3>
          <p className="text-sm text-muted-foreground">
            Build your survey by adding questions below
          </p>
        </div>
        <Button onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-1" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Settings className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center">
              No questions added yet. Click "Add Question" to start building your survey.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => renderQuestionForm(question, index))}
        </div>
      )}
    </div>
  )
} 