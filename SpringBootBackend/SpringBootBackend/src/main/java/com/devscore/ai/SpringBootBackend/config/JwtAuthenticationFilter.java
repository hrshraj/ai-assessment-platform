package com.devscore.ai.SpringBootBackend.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.devscore.ai.SpringBootBackend.service.UserDetailsServiceImpl;
import com.devscore.ai.SpringBootBackend.utils.JwtUtils;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String authHeader = request.getHeader("Authorization");
            String token = null;
            String email = null;

            System.out.println("=== JWT FILTER === Path: " + request.getRequestURI() + " Method: " + request.getMethod());

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7); // Remove "Bearer " prefix
                try {
                    email = jwtUtils.getUserNameFromJwtToken(token);
                    System.out.println("=== JWT FILTER === Email extracted: " + email);
                } catch (Exception ex) {
                    System.err.println("=== JWT FILTER === Token parse error: " + ex.getMessage());
                }
            }

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtUtils.validateJwtToken(token)) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    System.out.println("=== JWT FILTER === User loaded, authorities: " + userDetails.getAuthorities());

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("=== JWT FILTER === Authentication SET successfully");
                } else {
                    System.err.println("=== JWT FILTER === Token validation FAILED");
                }
            }
        } catch (Exception e) {
            System.err.println("=== JWT FILTER ERROR === " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }
}