"use client"

import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RefreshCw, Plus, Edit, Trash2, Save, X, Users } from "lucide-react"

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required")
})

type UserFormData = z.infer<typeof userSchema>

interface User {
  id: number
  name: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
}

interface SoapResponse {
  success: boolean
  data: string | null
  message: string
}

export default function SoapClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Partial<UserFormData>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const soapUrl = process.env.NEXT_PUBLIC_SOAP_URL || 
    (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? "http://localhost:9720/soap" 
      : "https://api-soap-sister.syafiqibra.site/soap")

  const validateForm = (data: UserFormData): boolean => {
    try {
      userSchema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<UserFormData> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof UserFormData] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const makeSoapRequest = async (operation: string, params: any = {}): Promise<SoapResponse> => {
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://example.com/user">
  <soap:Body>
    <tns:${operation}>
      ${Object.entries(params)
        .map(([key, value]) => `<${key}>${value}</${key}>`)
        .join("")}
    </tns:${operation}>
  </soap:Body>
</soap:Envelope>`

    console.log('Making SOAP request to:', soapUrl);
    console.log('Operation:', operation);
    console.log('Parameters:', params);

    try {
      const response = await fetch(soapUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": operation,
          "Accept": "text/xml, application/soap+xml, application/xml",
          "Cache-Control": "no-cache",
        },
        body: soapEnvelope,
      })

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text()

      console.log('SOAP Response:', xmlText)

      const successMatch = xmlText.match(/<(?:tns:)?success>(.*?)<\/(?:tns:)?success>/)
      const dataMatch = xmlText.match(/<(?:tns:)?data>(.*?)<\/(?:tns:)?data>/)
      const messageMatch = xmlText.match(/<(?:tns:)?message>(.*?)<\/(?:tns:)?message>/)

      console.log('Parsed values:', { successMatch, dataMatch, messageMatch })

      let decodedData = dataMatch ? dataMatch[1] : null
      if (decodedData) {
        try {
          const textarea = document.createElement('textarea')
          textarea.innerHTML = decodedData
          decodedData = textarea.value
        } catch (e) {
          console.warn('Failed to decode HTML entities:', e)
        }
      }

      return {
        success: successMatch ? successMatch[1] === "true" : false,
        data: decodedData,
        message: messageMatch ? messageMatch[1] : "Unknown response",
      }
    } catch (error) {
      console.error('SOAP Request Error:', error);
      return {
        success: false,
        data: null,
        message: `Error: ${error}`,
      }
    }
  }

  const showMessage = (msg: string, type: "success" | "error" = "success") => {
    if (type === "success") {
      toast.success(msg)
    } else {
      toast.error(msg)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await makeSoapRequest("getAllUsers")
      if (response.success && response.data) {
        try {
          console.log('Data to parse:', response.data)
          const userData = JSON.parse(response.data)
          setUsers(userData)
          showMessage("Users loaded successfully", "success")
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError)
          console.error('Raw data:', response.data)
          showMessage(`Error parsing user data: ${parseError}`, "error")
        }
      } else {
        showMessage(response.message, "error")
      }
    } catch (error) {
      showMessage(`Error loading users: ${error}`, "error")
    }
    setLoading(false)
  }

  const createUser = async () => {
    if (!validateForm(formData)) {
      showMessage("Please fix the validation errors", "error")
      return
    }

    setLoading(true)
    try {
      const response = await makeSoapRequest("createUser", formData)
      if (response.success) {
        showMessage("User created successfully", "success")
        setFormData({ name: "", email: "", phone: "" })
        setErrors({})
        loadUsers()
      } else {
        showMessage(response.message, "error")
      }
    } catch (error) {
      showMessage(`Error creating user: ${error}`, "error")
    }
    setLoading(false)
  }

  const updateUser = async () => {
    if (!editingId) {
      showMessage("No user selected for editing", "error")
      return
    }

    if (!validateForm(formData)) {
      showMessage("Please fix the validation errors", "error")
      return
    }

    setLoading(true)
    try {
      const response = await makeSoapRequest("updateUser", {
        id: editingId,
        ...formData,
      })
      if (response.success) {
        showMessage("User updated successfully", "success")
        setFormData({ name: "", email: "", phone: "" })
        setErrors({})
        setEditingId(null)
        loadUsers()
      } else {
        showMessage(response.message, "error")
      }
    } catch (error) {
      showMessage(`Error updating user: ${error}`, "error")
    }
    setLoading(false)
  }

  const deleteUser = async (id: number) => {
    const user = users.find(u => u.id === id)
    if (user) {
      setUserToDelete(user)
      setShowDeleteDialog(true)
    }
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    setLoading(true)
    try {
      const response = await makeSoapRequest("deleteUser", { id: userToDelete.id })
      if (response.success) {
        showMessage("User deleted successfully", "success")
        loadUsers()
      } else {
        showMessage(response.message, "error")
      }
    } catch (error) {
      showMessage(`Error deleting user: ${error}`, "error")
    }
    setLoading(false)
    setShowDeleteDialog(false)
    setUserToDelete(null)
  }

  const cancelDelete = () => {
    setShowDeleteDialog(false)
    setUserToDelete(null)
  }

  const editUser = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
    })
    setEditingId(user.id)
  }

  const cancelEdit = () => {
    setFormData({ name: "", email: "", phone: "" })
    setErrors({})
    setEditingId(null)
  }

  return (
    <div className="min-h-screen bg-background p-4 mt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-2">
            <Users className="h-8 w-8 " />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage users through SOAP web service integration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? "Edit User" : "Create New User"}
            </CardTitle>
            <CardDescription>{editingId ? "Update user information" : "Add a new user to the system"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button onClick={editingId ? updateUser : createUser} disabled={loading} className="btn-primary">
                {loading ? (
                  <RefreshCw className="h-4 w-4  animate-spin" />
                ) : editingId ? (
                  <Save className="h-4 w-4 " />
                ) : (
                  <Plus className="h-4 w-4 " />
                )}
                {loading ? "Processing..." : editingId ? "Update User" : "Create User"}
              </Button>

              {editingId && (
                <Button onClick={cancelEdit} variant="outline" className="btn-secondary bg-transparent">
                  <X className="h-4 w-4 " />
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Users ({users.length})
                </CardTitle>
                <CardDescription>Manage and view all users in the system</CardDescription>
              </div>
              <Button onClick={loadUsers} disabled={loading} className="btn-success">
                {loading ? <RefreshCw className="h-4 w-4  animate-spin" /> : <RefreshCw className="h-4 w-4 " />}
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium text-muted-foreground">No users found</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Refresh" to load users or create a new user above
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{user.id}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => editUser(user)} className="btn-warning">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteUser(user.id)}
                              className="btn-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user{" "}
              <strong>{userToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
