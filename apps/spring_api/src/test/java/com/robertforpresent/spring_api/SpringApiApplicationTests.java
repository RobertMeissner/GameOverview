package com.robertforpresent.spring_api;

import com.robertforpresent.spring_api.games.domain.Game;
import com.robertforpresent.spring_api.games.infrastructure.persistence.GameEntityMapper;
import com.robertforpresent.spring_api.games.infrastructure.persistence.JpaGameRepository;
import com.robertforpresent.spring_api.games.infrastructure.persistence.JpaGameRepositoryAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SpringApiApplicationTests {


}
