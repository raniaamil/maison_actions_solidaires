// src/app/api/upload/route.js
export const runtime = 'nodejs';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// POST - Upload de fichiers
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'general';

    if (!file) {
      return Response.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifications de sécurité
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: 'Fichier trop volumineux (max 5MB)' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: 'Type de fichier non autorisé. Formats acceptés: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Créer le dossier d'upload s'il n'existe pas
    const categoryDir = path.join(UPLOAD_DIR, category);
    if (!existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(file.name);
    const filename = `${timestamp}_${random}${extension}`;
    const filepath = path.join(categoryDir, filename);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URL publique du fichier
    const publicUrl = `/uploads/${category}/${filename}`;

    console.log('✅ Fichier uploadé avec succès:', {
      filename,
      size: file.size,
      type: file.type,
      category,
      url: publicUrl
    });

    return Response.json({
      success: true,
      message: 'Fichier uploadé avec succès',
      file: {
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        category,
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de l\'upload',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET - Lister les fichiers uploadés
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    
    const categoryDir = path.join(UPLOAD_DIR, category);
    
    if (!existsSync(categoryDir)) {
      return Response.json([]);
    }

    const { readdir, stat } = await import('fs/promises');
    const files = await readdir(categoryDir);
    
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filepath = path.join(categoryDir, filename);
        const stats = await stat(filepath);
        
        return {
          filename,
          url: `/uploads/${category}/${filename}`,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          category
        };
      })
    );

    // Trier par date de modification (plus récent en premier)
    fileDetails.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return Response.json(fileDetails);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des fichiers:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des fichiers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un fichier
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const category = searchParams.get('category') || 'general';

    if (!filename) {
      return Response.json(
        { error: 'Nom de fichier requis' },
        { status: 400 }
      );
    }

    // Sécurité : vérifier que le nom de fichier ne contient pas de caractères dangereux
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return Response.json(
        { error: 'Nom de fichier invalide' },
        { status: 400 }
      );
    }

    const filepath = path.join(UPLOAD_DIR, category, filename);

    // Vérifier que le fichier existe
    if (!existsSync(filepath)) {
      return Response.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le fichier
    const { unlink } = await import('fs/promises');
    await unlink(filepath);

    console.log('✅ Fichier supprimé:', filename);

    return Response.json({
      success: true,
      message: 'Fichier supprimé avec succès',
      filename
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la suppression',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}