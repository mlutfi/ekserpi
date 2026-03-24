import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import LoadingOverlay from '../components/LoadingOverlay';

const { width } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const { login, verify2FA } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.twoFactorRequired) {
        setTwoFactorToken(result.twoFactorToken || '');
        setShow2FA(true);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login gagal. Periksa kembali email dan password.';
      Alert.alert('Login Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Kode 2FA harus 6 digit');
      return;
    }
    setLoading(true);
    try {
      await verify2FA(otpCode, twoFactorToken);
    } catch (error: any) {
      Alert.alert('Error', 'Kode 2FA tidak valid');
    } finally {
      setLoading(false);
    }
  };

  if (show2FA) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <LinearGradient colors={['#0F0F1A', '#1A1A2E', '#0F0F1A']} style={styles.gradient}>
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Verifikasi 2FA</Text>
            <Text style={styles.subtitle}>Masukkan kode dari aplikasi authenticator</Text>

            <View style={styles.inputGroup}>
              <View style={[styles.inputContainer, styles.inputFocused]}>
                <Ionicons name="key-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Kode 6 Digit"
                  placeholderTextColor={Colors.textMuted}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handle2FAVerify} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.loginGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.loginText}>Verifikasi</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setShow2FA(false); setOtpCode(''); }} style={styles.backBtn}>
              <Text style={styles.backText}>← Kembali ke Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <LoadingOverlay visible={loading} message="Memverifikasi..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <LinearGradient colors={['#0F0F1A', '#1A1A2E', '#0F0F1A']} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="storefront" size={36} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>XRP POS</Text>
            <Text style={styles.tagline}>Point of Sale System</Text>
          </View>

          {/* Login form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Masuk ke Akun</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={20} color={emailFocused ? Colors.primary : Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="email@contoh.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, passwordFocused && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? Colors.primary : Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.loginGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.loginText}>Masuk</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Powered by Ekserpi • v1.0</Text>
        </KeyboardAvoidingView>
      </LinearGradient>
      <LoadingOverlay visible={loading} message="Sedang masuk..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: 4,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  backBtn: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 32,
  },
});

export default LoginScreen;
