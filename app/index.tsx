import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';
import { isAuthenticated, setAuthenticatedUser } from '../storage/auth';
import { User, createUser, getUser, loginUser } from '../storage/user';

export default function LoginScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      checkExistingUser();
    };
  
    initializeApp();
  }, []);

  const checkExistingUser = async () => {
    try {
      const isAuth = await isAuthenticated();
      if (isAuth) {
        const existingUser = await getUser();
        if (existingUser) {
          setUser(existingUser);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const loggedUser = await loginUser(username, password);
      setUser(loggedUser);
      await setAuthenticatedUser(loggedUser);
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Erreur', 'Identifiants incorrects');
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password || !name.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const newUser = await createUser(username, password, name, bio);
      setUser(newUser);
      await setAuthenticatedUser(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Erreur', 'Impossible de créer le compte');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Chargement...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Bienvenue {user.name} !</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/camera')}
        >
          <Text style={styles.buttonText}>Commencer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isRegistering ? 'Créer un compte' : 'Connexion'}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        placeholderTextColor={colors.muted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor={colors.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {isRegistering && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
          
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Bio (optionnel)"
            placeholderTextColor={colors.muted}
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </>
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={isRegistering ? handleRegister : handleLogin}
      >
        <Text style={styles.buttonText}>
          {isRegistering ? 'Créer mon compte' : 'Se connecter'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.switchButton}
        onPress={() => setIsRegistering(!isRegistering)}
      >
        <Text style={styles.switchButtonText}>
          {isRegistering ? 'Déjà un compte ? Se connecter' : 'Créer un compte'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  welcome: {
    fontSize: 20,
    color: colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchButtonText: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: 14,
  },
});