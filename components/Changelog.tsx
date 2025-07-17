"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase, supabaseAdmin } from "../lib/supabase"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Calendar, Edit, Trash2, Save, X, AlertCircle } from "lucide-react"

interface ChangelogEntry {
  id: string
  version: string
  title: string
  description: string
  changes: string[]
  created_at: string
  is_published: boolean
}

const Changelog: React.FC = () => {
  const { user } = useAuth()
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    description: "",
    changes: [""],
    is_published: true,
  })

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    fetchChangelogs()
  }, [])

  const fetchChangelogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("changelogs").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setChangelogs(data || [])
    } catch (err) {
      console.error("Error fetching changelogs:", err)
      setError("Failed to load changelogs")
    } finally {
      setLoading(false)
    }
  }

  const handleAddChangelog = async () => {
    if (!isAdmin) return

    try {
      setError(null)

      // Use RPC function to insert changelog
      const { data, error } = await supabase.rpc("insert_changelog", {
        p_version: formData.version,
        p_title: formData.title,
        p_description: formData.description,
        p_changes: formData.changes.filter((change) => change.trim() !== ""),
        p_is_published: formData.is_published,
      })

      if (error) {
        console.error("RPC Error:", error)
        throw error
      }

      // Reset form and refresh
      setFormData({
        version: "",
        title: "",
        description: "",
        changes: [""],
        is_published: true,
      })
      setShowAddForm(false)
      await fetchChangelogs()
    } catch (err) {
      console.error("Error adding changelog:", err)
      setError(`Error adding changelog: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleUpdateChangelog = async (id: string) => {
    if (!isAdmin) return

    try {
      setError(null)
      const { error } = await supabaseAdmin
        .from("changelogs")
        .update({
          version: formData.version,
          title: formData.title,
          description: formData.description,
          changes: formData.changes.filter((change) => change.trim() !== ""),
          is_published: formData.is_published,
        })
        .eq("id", id)

      if (error) throw error

      setEditingId(null)
      setFormData({
        version: "",
        title: "",
        description: "",
        changes: [""],
        is_published: true,
      })
      await fetchChangelogs()
    } catch (err) {
      console.error("Error updating changelog:", err)
      setError(`Error updating changelog: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleDeleteChangelog = async (id: string) => {
    if (!isAdmin) return

    if (!confirm("Are you sure you want to delete this changelog entry?")) return

    try {
      setError(null)
      const { error } = await supabaseAdmin.from("changelogs").delete().eq("id", id)

      if (error) throw error
      await fetchChangelogs()
    } catch (err) {
      console.error("Error deleting changelog:", err)
      setError(`Error deleting changelog: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const startEdit = (changelog: ChangelogEntry) => {
    setEditingId(changelog.id)
    setFormData({
      version: changelog.version,
      title: changelog.title,
      description: changelog.description,
      changes: changelog.changes.length > 0 ? changelog.changes : [""],
      is_published: changelog.is_published,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
      version: "",
      title: "",
      description: "",
      changes: [""],
      is_published: true,
    })
  }

  const addChangeField = () => {
    setFormData((prev) => ({
      ...prev,
      changes: [...prev.changes, ""],
    }))
  }

  const updateChangeField = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      changes: prev.changes.map((change, i) => (i === index ? value : change)),
    }))
  }

  const removeChangeField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isAdmin && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Changelog Management</h2>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Changelog</span>
          </Button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Changelog Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Version</label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g., v1.2.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., New Features & Bug Fixes"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this release..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Changes</label>
              {formData.changes.map((change, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <Input
                    value={change}
                    onChange={(e) => updateChangeField(index, e.target.value)}
                    placeholder="Describe a change..."
                  />
                  {formData.changes.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeChangeField(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addChangeField}>
                <Plus className="w-4 h-4 mr-2" />
                Add Change
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.is_published}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
              />
              <label htmlFor="published" className="text-sm font-medium">
                Publish immediately
              </label>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddChangelog}>
                <Save className="w-4 h-4 mr-2" />
                Save Changelog
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Changelog List */}
      <div className="space-y-4">
        {changelogs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No changelog entries found.</p>
            </CardContent>
          </Card>
        ) : (
          changelogs.map((changelog) => (
            <Card key={changelog.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant={changelog.is_published ? "default" : "secondary"}>{changelog.version}</Badge>
                    <h3 className="text-lg font-semibold">{changelog.title}</h3>
                    {!changelog.is_published && (
                      <Badge variant="outline" className="text-yellow-600">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(changelog.created_at).toLocaleDateString()}
                    </div>
                    {isAdmin && (
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" onClick={() => startEdit(changelog)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteChangelog(changelog.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === changelog.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Version</label>
                        <Input
                          value={formData.version}
                          onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Changes</label>
                      {formData.changes.map((change, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <Input value={change} onChange={(e) => updateChangeField(index, e.target.value)} />
                          {formData.changes.length > 1 && (
                            <Button variant="outline" size="sm" onClick={() => removeChangeField(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addChangeField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Change
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`published-${changelog.id}`}
                        checked={formData.is_published}
                        onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
                      />
                      <label htmlFor={`published-${changelog.id}`} className="text-sm font-medium">
                        Published
                      </label>
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={() => handleUpdateChangelog(changelog.id)}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-700 dark:text-gray-300">{changelog.description}</p>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Changes:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {changelog.changes.map((change, index) => (
                          <li key={index} className="text-gray-600 dark:text-gray-400">
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default Changelog
